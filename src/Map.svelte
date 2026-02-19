<script>
  import { onMount } from "svelte";
  import L from "leaflet";
  import "leaflet/dist/leaflet.css";

  export let alumni_geocoded;
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

  function drawCircles() {
    alumni_geocoded.forEach((d) => {
      const lat = d?.original?.address?.lat;
      const lon = d?.original?.address?.lon;

      if (lat && lon) {
        const popup = `
          <strong>${d.original.name}</strong><br/>
          ${d.original.place_name}<br/>
          ${d.original.entry_year}
        `;
        L.circleMarker([lat, lon], {
          radius: 5,
          fillColor: "black",
          color: "black",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.4,
        })
          .addTo(map)
          .bindPopup(popup);

        L.circleMarker([lat, lon], {
          radius: 5,
          fillColor: "black",
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
