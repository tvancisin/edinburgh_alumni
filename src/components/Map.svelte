<script>
  import { onMount } from "svelte";
  import L from "leaflet";
  import "leaflet/dist/leaflet.css";
  import "leaflet.markercluster";
  import "leaflet.markercluster/dist/MarkerCluster.css";
  import "leaflet.markercluster/dist/MarkerCluster.Default.css";
  import { formatWikidata, formatThesisData } from "../utils.js";

  export let medics_sample;
  export let matriculations_medics;
  export let selected_key = "medics_sample";
  export let visible = false;
  export let colonies_1885;

  let map,
    map2,
    currentLocationField = "university_address",
    historicalClusterGroup,
    modernClusterGroup,
    historicalColoniesLayer,
    modernColoniesLayer,
    historicalStandaloneMarkers = [],
    modernStandaloneMarkers = [],
    historicalRouteLayers = [],
    modernRouteLayers = [],
    routeDrawVersion = 0,
    key = "3rzey539Y03YWue7YR65",
    sliderPosition = 60,
    isDragging = false,
    mapContainer;

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

    // modern map
    map2 = L.map("map-modern", {
      zoomControl: true,
      attributionControl: true,
    }).setView([55.9533, -3.1883], 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map2);

    // marker clustering
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

    // medical school marker
    const universityCoordinates = L.latLng(
      55.945451058135745,
      -3.190103658123212,
    );
    const universityIcon = L.divIcon({
      className: "university-logo-wrapper",
      html: `<div class="university-logo-marker"><img src="./img/uni.png" alt="University logo" /></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
    });

    const popup = "<strong>Medical School</strong>";

    L.marker(universityCoordinates, { icon: universityIcon })
      .bindPopup(popup)
      .addTo(map);
    L.marker(universityCoordinates, { icon: universityIcon })
      .bindPopup(popup)
      .addTo(map2);

    // Sync the two maps
    syncMaps(map, map2);
    syncMaps(map2, map);

    updateColoniesLayer();
    drawCircles(currentLocationField);
    drawIsochrones();
  });

  function createColoniesLayer() {
    if (!colonies_1885?.features?.length) return null;

    return L.geoJSON(colonies_1885, {
      style: {
        color: "#8b5a2b",
        weight: 1,
        opacity: 0.8,
        fillColor: "black",
        fillOpacity: 0.18,
      },
      interactive: false,
    });
  }

  function updateColoniesLayer() {
    if (!map || !map2) return;

    if (historicalColoniesLayer) {
      map.removeLayer(historicalColoniesLayer);
      historicalColoniesLayer = null;
    }

    if (modernColoniesLayer) {
      map2.removeLayer(modernColoniesLayer);
      modernColoniesLayer = null;
    }

    historicalColoniesLayer = createColoniesLayer();
    modernColoniesLayer = createColoniesLayer();

    historicalColoniesLayer?.addTo(map);
    modernColoniesLayer?.addTo(map2);

    historicalColoniesLayer?.bringToBack();
    modernColoniesLayer?.bringToBack();
  }

  function getSpeedForDirection(angleDeg) {
    // crude but effective heuristic from UK perspective

    // west = Atlantic → fast (sea)
    if (angleDeg > 200 && angleDeg < 340) {
      return 220; // km/day (sea)
    }

    // south-east = Europe (mixed rail + land)
    if (angleDeg >= 90 && angleDeg <= 200) {
      return 80; // faster than land due to early rail
    }

    // north = Scotland highlands (slower)
    if (angleDeg >= 340 || angleDeg <= 20) {
      return 30;
    }

    // default land
    return 40;
  }

  function generateIsochrone(center, days) {
    const points = [];
    const steps = 72; // every 5 degrees

    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * 360;
      const speed = getSpeedForDirection(angle);

      const distanceKm = speed * days;

      const point = destinationPoint([center.lat, center.lng], angle, distanceKm);
      points.push(point);
    }

    return points;
  }

  function destinationPoint([lat, lng], bearingDeg, distanceKm) {
    const R = 6371; // Earth radius in km

    const bearing = (bearingDeg * Math.PI) / 180;
    const lat1 = (lat * Math.PI) / 180;
    const lng1 = (lng * Math.PI) / 180;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distanceKm / R) +
        Math.cos(lat1) * Math.sin(distanceKm / R) * Math.cos(bearing),
    );

    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(distanceKm / R) * Math.cos(lat1),
        Math.cos(distanceKm / R) - Math.sin(lat1) * Math.sin(lat2),
      );

    return [(lat2 * 180) / Math.PI, (lng2 * 180) / Math.PI];
  }

  function drawIsochrones() {
    const center = L.latLng(55.945451058135745, -3.190103658123212);

    const timeSteps = [
      { label: "1 day", days: 1, color: "#8B4513" },
      { label: "1 week", days: 7, color: "#CD853F" },
      { label: "1 month", days: 30, color: "#DEB887" },
    ];

    timeSteps.forEach((t) => {
      const polygonCoords = generateIsochrone(center, t.days);
      // Convert number[][] to LatLngExpression[]
      const latLngCoords = polygonCoords.map(([lat, lng]) => L.latLng(lat, lng));

      L.polygon(latLngCoords, {
        color: t.color,
        weight: 1,
        fillOpacity: 0.08,
      }).addTo(map);

      L.polygon(latLngCoords, {
        color: t.color,
        weight: 1,
        fillOpacity: 0.08,
      }).addTo(map2);

      // Add text label at 45° angle from center (NE position)
      const labelPoint = destinationPoint([center.lat, center.lng], 45, (t.days * getSpeedForDirection(45)) * 0.5);
      const labelLatLng = L.latLng(labelPoint[0], labelPoint[1]);

      const textIcon = L.divIcon({
        className: "isochrone-label",
        html: `<div style="font-size: 11px; font-weight: bold; color: ${t.color}; text-shadow: 1px 1px 2px rgba(255,255,255,0.8); pointer-events: none;">${t.label}</div>`,
        iconSize: [60, 20],
        iconAnchor: [30, 10],
      });

      L.marker(labelLatLng, { icon: textIcon }).addTo(map);
      L.marker(labelLatLng, { icon: textIcon }).addTo(map2);
    });
  }

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

  function clearRouteLayers() {
    historicalRouteLayers.forEach((r) => map?.removeLayer(r));
    modernRouteLayers.forEach((r) => map2?.removeLayer(r));
    historicalRouteLayers = [];
    modernRouteLayers = [];
  }

  async function drawRoutes(origins) {
    const destLon = -3.190103658123212;
    const destLat = 55.945451058135745;
    const thisVersion = routeDrawVersion;

    // Deduplicate origins by rounded coordinate
    const seen = new Set();
    const unique = origins.filter(([lat, lon]) => {
      const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    await Promise.all(
      unique.map(async ([lat, lon]) => {
        const url =
          `https://routing.openstreetmap.de/routed-foot/route/v1/driving/` +
          `${lon},${lat};${destLon},${destLat}` +
          `?overview=full&geometries=geojson`;
        try {
          const res = await fetch(url);
          const data = await res.json();
          const coords = data?.routes?.[0]?.geometry?.coordinates;
          if (!coords || thisVersion !== routeDrawVersion) return;
          const latLngs = coords.map(([lo, la]) => [la, lo]);
          const style = { color: "black", weight: 2, opacity: 0.4 };
          historicalRouteLayers.push(L.polyline(latLngs, style).addTo(map));
          modernRouteLayers.push(L.polyline(latLngs, style).addTo(map2));
        } catch {
          // silently skip failed routes
        }
      }),
    );
  }

  function drawCircles(which) {
    const activeDataset =
      selected_key === "matriculations" ? matriculations_medics : medics_sample;

    historicalClusterGroup?.clearLayers();
    modernClusterGroup?.clearLayers();
    clearStandaloneMarkers();
    clearRouteLayers();
    routeDrawVersion += 1;

    if (!Array.isArray(activeDataset)) return;

    if (selected_key === "matriculations") {
      activeDataset.forEach((d) => {
        const fullName =
          `${d?.name?.forename || ""} ${d?.name?.middlename || ""} ${d?.name?.surname || ""}`.trim();

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

        const previousUniversities = Array.isArray(
          d?.source_data?.previous_university,
        )
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

    const routeOrigins = [];

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
        } else {
          historicalMarker.addTo(map);
          modernMarker.addTo(map2);
        }

        if (which === "university_address") {
          routeOrigins.push([Number(lat), Number(lon)]);
        }
      }
    });

    if (which === "university_address" && routeOrigins.length > 0) {
      drawRoutes(routeOrigins);
    }
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

  // might be unnecessary so keep tesing
  $: if (map && map2 && historicalClusterGroup && modernClusterGroup) {
    selected_key;
    medics_sample;
    matriculations_medics;
    drawCircles(currentLocationField);
  }

  $: if (map && map2) {
    colonies_1885;
    updateColoniesLayer();
  }

  $: if (map && map2) {
    selected_key;
    currentLocationField;
    applyViewSettings();
  }

  function escapeCssUrl(url) {
    return String(url).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  // mouse events
  function onMouseDown(e) {
    if (!showSplitSlider) return;
    isDragging = true;
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!showSplitSlider) return;
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
      latitude:
        currentLocationField === "university_address" ? 55.9533 : 25.9533,
    };
  }

  // switch between datasets inside the map
  function switch_data() {
    currentLocationField =
      currentLocationField === "university_address"
        ? "birthplace"
        : "university_address";

    drawCircles(currentLocationField);
    applyViewSettings();
  }

  $: showSplitSlider =
    selected_key === "medics_sample" && currentLocationField === "university_address";
</script>

<svelte:window
  on:mousemove={onMouseMove}
  on:mouseup={onMouseUp}
  on:touchmove={onMouseMove}
  on:touchend={onMouseUp}
/>

<div class="map-container" class:visible class:split-mode={showSplitSlider} bind:this={mapContainer}>
  <!-- Historical map: full size, clipped to left of slider -->
  <div
    id="map-historical"
    style={showSplitSlider
      ? `clip-path: inset(0 ${100 - sliderPosition}% 0 0);`
      : "clip-path: inset(0 100% 0 0);"}
  ></div>

  <!-- Modern map: full size, clipped to right of slider -->
  <div
    id="map-modern"
    style={showSplitSlider
      ? `clip-path: inset(0 0 0 ${sliderPosition}%);`
      : "clip-path: inset(0 0 0 0);"}
  ></div>

  <!-- Slider divider -->
  {#if showSplitSlider}
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
  {/if}

  <!-- Labels -->
  <h1>
    {currentLocationField === "university_address"
      ? "University Addresses"
      : "Birth Locations"}
  </h1>
  {#if showSplitSlider}
    <div class="label label-left">1888</div>
  {/if}
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
    cursor: default;
    z-index: 9;
    transform: translateY(-100%);
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .map-container.visible {
    transform: translateY(0);
  }

  .map-container.split-mode {
    cursor: col-resize;
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

  :global(.university-logo-wrapper) {
    background: transparent;
    border: none;
  }

  :global(.university-logo-marker) {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: black;
    border: 1px solid black;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  :global(.university-logo-marker img) {
    width: 36px;
    height: 36px;
    /* object-fit: contain; */
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
