<script>
  import { onMount } from "svelte";
  import L from "leaflet";
  import "leaflet/dist/leaflet.css";
  import "leaflet.markercluster";
  import "leaflet.markercluster/dist/MarkerCluster.css";
  import "leaflet.markercluster/dist/MarkerCluster.Default.css";

  export let medics_sample;
  export let matriculations_medics;
  export let selected_key = "medics_sample";
  export let visible = false;
  
  // todo
  // keep emphasizing uncertainty in circles somehow

  let currentLocationField = "university_address";
  let map;
  let map2;
  let historicalClusterGroup;
  let modernClusterGroup;
  let historicalStandaloneMarkers = [];
  let modernStandaloneMarkers = [];
  const key = "3rzey539Y03YWue7YR65";

  let sliderPosition = 50;
  let isDragging = false;
  let mapContainer;

  onMount(() => {
    // historical map
    map = L.map("map-historical", {
      zoomControl: false,
      attributionControl: false,
    }).setView([55.9533, -3.1883], 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(map);
    L.tileLayer(
      `https://api.maptiler.com/tiles/uk-osgb10k1888/{z}/{x}/{y}.png?key=${key}`,
      {
        minZoom: 10,
        maxZoom: 18,
        crossOrigin: true,
        opacity: 1,
        // only request map tiles for the UK.
        bounds: L.latLngBounds([49.5, -8.2], [60.9, 2.0]),
      },
    ).addTo(map);

    // Modern map
    map2 = L.map("map-modern", {
      zoomControl: true,
      attributionControl: true,
    }).setView([55.9533, -3.1883], 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map2);

    historicalClusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      disableClusteringAtZoom: 16,
    });
    modernClusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      disableClusteringAtZoom: 16,
    });

    map.addLayer(historicalClusterGroup);
    map2.addLayer(modernClusterGroup);

    // Sync the two maps
    syncMaps(map, map2);
    syncMaps(map2, map);

    drawCircles(currentLocationField);
  });

  function syncMaps(source, target) {
    source.on("move", () => {
      target.off("move");
      target.setView(source.getCenter(), source.getZoom(), { animate: false });
      target.on("move", () => {
        source.off("move");
        source.setView(target.getCenter(), target.getZoom(), {
          animate: false,
        });
        source.on("move", () => syncMaps(source, target));
      });
    });
  }

  function formatWikidata(wd) {
    if (!wd) return "";

    return `
    <hr/>
    <p style="font-size: 14px; padding-bottom: 5px; padding-top: 5px; margin: 0;"><strong>Wikidata Enrichment</strong></p>
    <b>Birth:</b> ${wd.birth_date?.slice(0, 10) || "—"} (${wd.birth_place || "—"})<br/>
    <b>Death:</b> ${wd.death_date?.slice(0, 10) || "—"} (${wd.death_place || "—"})<br/>
    <b>Citizenship:</b> ${wd.citizenship || "—"}<br/>
    <b>Gender:</b> ${wd.gender || "—"}<br/>
    <b>Occupations:</b> ${
      Array.isArray(wd.occupations)
        ? wd.occupations.length
          ? wd.occupations.join(", ")
          : "—"
        : wd.occupations || "—"
    }<br/>
    <b>Member of:</b> ${
      Array.isArray(wd.member_of)
        ? wd.member_of.length
          ? wd.member_of.join(", ")
          : "—"
        : wd.member_of || "—"
    }<br/>
    <b>Education:</b> ${
      Array.isArray(wd.education)
        ? wd.education.length
          ? wd.education.join(", ")
          : "—"
        : wd.education || "—"
    }<br/>
    <b>Employers:</b> ${
      Array.isArray(wd.employers)
        ? wd.employers.length
          ? wd.employers.join(", ")
          : "—"
        : wd.employers || "—"
    }<br/>
    <b>Awards:</b> ${
      Array.isArray(wd.awards)
        ? wd.awards.length
          ? wd.awards.join(", ")
          : "—"
        : wd.awards || "—"
    }<br/>
    <b>Position:</b> ${
      Array.isArray(wd.positions)
        ? wd.positions.length
          ? wd.positions.join(", ")
          : "—"
        : wd.positions || "—"
    }<br/>
    <b>Wikipedia:</b> ${
      Array.isArray(wd.wikipedia_url)
        ? wd.wikipedia_url.length
          ? wd.wikipedia_url
              .map(
                (url) =>
                  `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
              )
              .join(", ")
          : "—"
        : wd.wikipedia_url
          ? `<a href="${wd.wikipedia_url}" target="_blank" rel="noopener noreferrer">Link</a>`
          : "—"
    }<br/>
    <b>Wikidata:</b> ${
      Array.isArray(wd.wikidata_url)
        ? wd.wikidata_url.length
          ? wd.wikidata_url
              .map(
                (url) =>
                  `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
              )
              .join(", ")
          : "—"
        : wd.wikidata_url
          ? `<a href="${wd.wikidata_url}" target="_blank" rel="noopener noreferrer">Link</a>`
          : "—"
    }<br/>
    <b>Image:</b><br/>
    ${
      wd.image
        ? `<img src="${wd.image}" width="120" style="margin-top:5px;" />`
        : "—"
    }
  `;
  }

  function formatThesisData(td) {
    if (!td) return "";

    const safe = (v) =>
      v && v !== "NaN" && v !== "Embargo or non_Pdfs" ? v : "—";

    return `
    <hr/>
    <details>
      <summary><strong>Thesis Record</strong></summary>
      
      <b>Title:</b> ${safe(td.Title)}<br/>
      <b>Author:</b> ${safe(td.Authors)}<br/>
      <b>Year:</b> ${safe(td.Year)}<br/>
      <b>Type:</b> ${safe(td.type)}<br/>
      <b>College:</b> ${safe(td.College)}<br/>
      <b>Collection:</b> ${safe(td.Collections)}<br/>
      <b>Section:</b> ${safe(td.SectionNamesFlat)}<br/>
      <b>Publisher:</b> ${safe(td.publishers)}<br/>
      <b>Full date:</b> ${safe(td.DatesFull)}<br/>

      ${
        td.Link
          ? `<b>ERA Record:</b> <a href="${td.Link}" target="_blank">View record</a><br/>`
          : ""
      }

      ${
        td.PDF && td.Issues !== "Embargo or non_Pdfs"
          ? `<b>PDF:</b> <a href="${td.PDF}" target="_blank">Download</a><br/>`
          : ""
      }

      ${
        td.MetadataLink
          ? `<b>Metadata:</b> <a href="${td.MetadataLink}" target="_blank">Full metadata</a><br/>`
          : ""
      }

      <b>Thesis ID:</b> ${safe(td.ThesisId)}<br/>
      <b>Subject ID:</b> ${safe(td.SubjectId)}<br/>
      
    </details>
  `;
  }

  function drawCircles(which) {
    const activeDataset =
      selected_key === "matriculations" ? matriculations_medics : medics_sample;

    console.log(activeDataset, which);
    
    historicalClusterGroup?.clearLayers();
    modernClusterGroup?.clearLayers();
    clearStandaloneMarkers();

    if (!Array.isArray(activeDataset)) return;

    if (selected_key === "matriculations") {
      activeDataset.forEach((d) => {
        const fullName = `${d?.name?.forename || ""} ${d?.name?.middlename || ""} ${d?.name?.surname || ""}`.trim();

        if (which === "birthplace") {
          const birthplace = d?.source_data?.birthplace;
          const lat = Number(birthplace?.lat);
          const lon = Number(birthplace?.lon);

          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

          const popup = `
  <p style="font-size: 16px; padding-bottom: 5px; margin: 0;">
  <strong>${fullName || d?.name?.original || "Unknown"}</strong></p>
  <strong>Birthplace:</strong> ${birthplace?.original_name || birthplace?.place_name || "—"}<br/>
  <strong>Entry year:</strong> ${d?.source_data?.entry_year || d?.entry_year || "—"}<br/>
  <strong>Nationality:</strong> ${d?.source_data?.nationality || "—"}<br/>
`;

          const historicalMarker = createPersonMarker(d, lat, lon, popup);
          const modernMarker = createPersonMarker(d, lat, lon, popup);

          historicalMarker.addTo(map);
          modernMarker.addTo(map2);
          historicalStandaloneMarkers.push(historicalMarker);
          modernStandaloneMarkers.push(modernMarker);

          return;
        }

        const previousUniversities = Array.isArray(d?.source_data?.previous_university)
          ? d.source_data.previous_university
          : [];

        previousUniversities.forEach((uni) => {
          const lat = Number(uni?.lat);
          const lon = Number(uni?.lon);

          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

          const popup = `
  <p style="font-size: 16px; padding-bottom: 5px; margin: 0;">
  <strong>${fullName || d?.name?.original || "Unknown"}</strong></p>
  <strong>Previous university:</strong> ${uni?.original_name || "—"}<br/>
  <strong>Degree:</strong> ${uni?.degree || "—"}<br/>
  <strong>Entry year:</strong> ${d?.source_data?.entry_year || d?.entry_year || "—"}<br/>
  <strong>Nationality:</strong> ${d?.source_data?.nationality || "—"}<br/>
`;

          const historicalMarker = createPersonMarker(d, lat, lon, popup);
          const modernMarker = createPersonMarker(d, lat, lon, popup);

          historicalMarker.addTo(map);
          modernMarker.addTo(map2);
          historicalStandaloneMarkers.push(historicalMarker);
          modernStandaloneMarkers.push(modernMarker);
        });
      });

      return;
    }

    activeDataset.forEach((d) => {
      const lat = d?.source_data?.[which]?.lat;
      const lon = d?.source_data?.[which]?.lon;

      if (lat && lon) {
        const popup = `
  <p style="font-size: 16px; padding-bottom: 5px; margin: 0;">
  <strong>${d.name.forename} ${d.name.middle_name || ""} ${d.name.surname}</strong></p>
  <strong>Birthplace:</strong> ${d.source_data.birthplace?.original_name || "—"}<br/>
  <strong>Edinburgh address:</strong> ${d.source_data?.university_address?.original_name}<br/>
  <strong>Entry year:</strong> ${d.entry_year}<br/>
  <strong>Entry age:</strong> ${d.source_data.age}<br/>
  <strong>Nationality:</strong> ${d.source_data.nationality}<br/>
  <strong>Thesis:</strong> ${d.source_data.thesis || "—"}<br/>
  
  ${formatThesisData(d.thesis_data)}
  ${formatWikidata(d.wikidata)}
`;
        const historicalMarker = createPersonMarker(d, lat, lon, popup);
        const modernMarker = createPersonMarker(d, lat, lon, popup);

        if (historicalClusterGroup && modernClusterGroup) {
          historicalClusterGroup.addLayer(historicalMarker);
          modernClusterGroup.addLayer(modernMarker);
          return;
        }

        historicalMarker.addTo(map);
        modernMarker.addTo(map2);
      }
    });
  }

  function clearStandaloneMarkers() {
    historicalStandaloneMarkers.forEach((marker) => map?.removeLayer(marker));
    modernStandaloneMarkers.forEach((marker) => map2?.removeLayer(marker));
    historicalStandaloneMarkers = [];
    modernStandaloneMarkers = [];
  }

  function applyViewSettings() {
    if (!map || !map2) return;

    const { zoom, latitude } = getViewSettings();
    map.setView([latitude, -3.1883], zoom);
    map2.setView([latitude, -3.1883], zoom);
  }

  $: if (map && map2 && historicalClusterGroup && modernClusterGroup) {
    selected_key;
    medics_sample;
    matriculations_medics;
    drawCircles(currentLocationField);
  }

  $: if (map && map2) {
    selected_key;
    currentLocationField;
    applyViewSettings();
  }

  function escapeCssUrl(url) {
    return String(url).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  function createPersonMarker(d, lat, lon, popup) {
    const imageUrl = d?.wikidata?.image;

    if (imageUrl) {
      return L.marker([lat, lon], {
        icon: L.divIcon({
          className: "photo-marker-wrapper",
          html: `<div class="photo-marker" style="background-image: url('${escapeCssUrl(imageUrl)}');"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          popupAnchor: [0, -9],
        }),
      }).bindPopup(popup);
    }

    const radius = d.wikidata != null ? 15 : 2;
    const diameter = radius * 2;

    return L.marker([lat, lon], {
      icon: L.divIcon({
        className: "circle-marker-wrapper",
        html: `<div class="circle-marker-dot" style="width:${diameter}px;height:${diameter}px;"></div>`,
        iconSize: [diameter, diameter],
        iconAnchor: [radius, radius],
        popupAnchor: [0, -radius],
      }),
    }).bindPopup(popup);
  }

  function onMouseDown(e) {
    isDragging = true;
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    const rect = mapContainer.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    sliderPosition = Math.min(100, Math.max(0, (x / rect.width) * 100));
  }

  function onMouseUp() {
    isDragging = false;
  }

  function getViewSettings() {
    if (selected_key === "matriculations") {
      return { zoom: 3, latitude: 25.9533 };
    }

    return {
      zoom: currentLocationField === "university_address" ? 13 : 3,
      latitude: currentLocationField === "university_address" ? 55.9533 : 25.9533,
    };
  }

  function switch_data() {
    currentLocationField =
      currentLocationField === "university_address" ? "birthplace" : "university_address";

    drawCircles(currentLocationField);
    applyViewSettings();
  }
</script>

<svelte:window
  on:mousemove={onMouseMove}
  on:mouseup={onMouseUp}
  on:touchmove={onMouseMove}
  on:touchend={onMouseUp}
/>

<div class="map-container" class:visible bind:this={mapContainer}>
  <!-- Historical map: full size, clipped to left of slider -->
  <div
    id="map-historical"
    style="clip-path: inset(0 {100 - sliderPosition}% 0 0);"
  ></div>

  <!-- Modern map: full size, clipped to right of slider -->
  <div id="map-modern" style="clip-path: inset(0 0 0 {sliderPosition}%);"></div>

  <!-- Slider divider -->
  <div
    class="slider-divider"
    style="left: {sliderPosition}%;"
    on:mousedown={onMouseDown}
    on:touchstart={onMouseDown}
    role="slider"
    aria-valuenow={sliderPosition}
    aria-valuemin={0}
    aria-valuemax={100}
    tabindex="0"
  >
    <div class="slider-line"></div>
    <!-- <div class="slider-handle">
      <span>&#8249;</span>
      <span>&#8250;</span>
    </div> -->
  </div>

  <!-- Labels -->
  <h1>
    {currentLocationField === "university_address"
      ? "University Addresses"
      : "Birth Locations"}
  </h1>
  <div class="label label-left">1888</div>
  <div class="label label-right">2026</div>
  <button class="switch_button" on:click={switch_data}>
    {currentLocationField === "university_address"
      ? "Show Birth Locations"
      : "Show University Addresses"}
  </button>
</div>

<style>
  .map-container {
    position: absolute;
    top: 0;
    left: 0;
    height: 100vh;
    width: 60%;
    overflow: hidden;
    cursor: col-resize;
    z-index: 9;
    transform: translateY(-100%);
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .map-container.visible {
    transform: translateY(0);
  }

  #map-historical,
  #map-modern {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
  }

  .slider-divider {
    position: absolute;
    top: 0;
    height: 100%;
    transform: translateX(-50%);
    z-index: 1000;
    cursor: col-resize;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .slider-line {
    width: 10px;
    height: 100%;
    background: rgb(0, 0, 0);
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
    pointer-events: none;
  }

  h1 {
    position: absolute;
    top: 0px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1001;
    background: rgba(50, 50, 50, 0.95);
    color: white;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 1.2rem;
    font-weight: 600;
    pointer-events: none;
  }

  .label {
    position: absolute;
    top: 16px;
    z-index: 1001;
    background: rgba(0, 0, 0, 0.55);
    color: white;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    pointer-events: none;
    letter-spacing: 0.05em;
  }

  .label-left {
    left: 16px;
  }

  .label-right {
    right: 16px;
  }

  .switch_button {
    position: absolute;
    top: 50px;
    left: 10px;
    z-index: 1001;
    background: steelblue;
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .switch_button:hover {
    background: rgb(50, 91, 124);
  }

  :global(.photo-marker-wrapper) {
    background: transparent;
    border: none;
  }

  :global(.circle-marker-wrapper) {
    background: transparent;
    border: none;
  }

  :global(.circle-marker-dot) {
    border-radius: 50%;
    border: 1px solid black;
    background: black;
    opacity: 0.4;
  }

  :global(.photo-marker) {
    width: 35px;
    height: 35px;
    border-radius: 50%;
    border: 1px solid black;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  :global(.marker-cluster-small) {
    background: rgba(0, 0, 0, 0.2);
  }
  :global(.marker-cluster-small div) {
    background: rgba(0, 0, 0, 0.35);
  }

  :global(.marker-cluster-medium) {
    background: rgba(0, 0, 0, 0.35);
  }
  :global(.marker-cluster-medium div) {
    background: rgba(0, 0, 0, 0.55);
  }

  :global(.marker-cluster-large) {
    background: rgba(0, 0, 0, 0.55);
  }
  :global(.marker-cluster-large div) {
    background: rgba(0, 0, 0, 0.75);
  }

  :global(.marker-cluster span) {
    color: white;
    font-family: "Montserrat", sans-serif;
    font-weight: 600;
  }

  :global(.circle-marker-dot) {
    opacity: 0.7;
  }
</style>
