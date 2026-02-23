<script>
  import { onMount } from "svelte";
  import L from "leaflet";
  import "leaflet/dist/leaflet.css";

  export let medics_sample;
  export let visible = false;

  let map;
  let map2;
  const key = "3rzey539Y03YWue7YR65";

  let sliderPosition = 50;
  let isDragging = false;
  let mapContainer;

  onMount(() => {
    // historical map
    map = L.map("map-historical", {
      zoomControl: false,
      attributionControl: false,
    }).setView([55.9533, -3.1883], 14);
    L.tileLayer(
      `https://api.maptiler.com/tiles/uk-osgb10k1888/{z}/{x}/{y}.png?key=${key}`,
      { maxZoom: 18, crossOrigin: true },
    ).addTo(map);

    // Modern map
    map2 = L.map("map-modern", {
      zoomControl: true,
      attributionControl: true,
    }).setView([55.9533, -3.1883], 14);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map2);

    // Sync the two maps
    syncMaps(map, map2);
    syncMaps(map2, map);

    drawCircles();
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

    const list = (arr) =>
      Array.isArray(arr) && arr.length
        ? "<ul>" + arr.map((x) => `<li>${x}</li>`).join("") + "</ul>"
        : "—";

    return `
    <hr/>
    <strong>Wikidata Enrichment</strong><br/>
    <b>Label:</b> ${wd.label || "—"}<br/>
    <b>Birth:</b> ${wd.birth_date?.slice(0, 10) || "—"} (${wd.birth_place || "—"})<br/>
    <b>Death:</b> ${wd.death_date?.slice(0, 10) || "—"} (${wd.death_place || "—"})<br/>
    <b>Citizenship:</b> ${wd.citizenship || "—"}<br/>
    <b>Gender:</b> ${wd.gender || "—"}<br/>
    <b>Occupations:</b> ${list(wd.occupations)}<br/>
    <b>Member of:</b> ${list(wd.member_of)}<br/>
    <b>Education:</b> ${list(wd.education)}<br/>
    <b>Employers:</b> ${list(wd.employers)}<br/>
    <b>Awards:</b> ${list(wd.awards)}<br/>
    <b>Position:</b> ${list(wd.positions)}<br/>
    ${
      wd.image
        ? `<img src="${wd.image}" width="120" style="margin-top:5px;" />`
        : ""
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

  function drawCircles() {
    medics_sample.forEach((d) => {
      console.log(d);

      if (d.match.status == "matched") {
        console.warn("matched record:", d);
      }

      const lat = d?.source_data?.address?.lat;
      const lon = d?.source_data?.address?.lon;

      if (lat && lon) {
        const popup = `
  <strong>${d.name.original}</strong><br/>
  ${d.source_data.address.place_name}<br/>
  Entry year: ${d.entry_year}<br/>
  
  ${formatThesisData(d.thesis_data)}
  ${formatWikidata(d.wikidata)}
`;
        L.circleMarker([lat, lon], {
          radius: d.match.status == "matched" ? 8 : 4,
          fillColor: d.wikidata != null ? "yellow" : "black",
          color: "black",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.4,
        })
          .addTo(map)
          .bindPopup(popup);

        L.circleMarker([lat, lon], {
          radius: d.match.status == "matched" ? 8 : 4,
          fillColor: d.wikidata != null ? "yellow" : "black",
          color: "black",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.4,
        })
          .addTo(map2)
          .bindPopup(popup);
      }
    });
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
  <div class="label label-left">1888</div>
  <div class="label label-right">2026</div>
</div>

<style>
  .map-container {
    position: absolute;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100%;
    overflow: hidden;
    cursor: col-resize;
    /* z-index: 1010; */
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
    background: white;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
    pointer-events: none;
  }

  .slider-handle {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: white;
    border-radius: 50%;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    font-size: 1.4rem;
    color: #333;
    user-select: none;
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
</style>
