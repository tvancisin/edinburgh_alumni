<script>
  import * as d3 from "d3";
  import "./lib/d3.sketchy.js";
  import { onMount } from "svelte";
  import Map from "./components/Map.svelte";
  import Timeline from "./components/Timeline.svelte";
  import Details from "./components/Details.svelte";
  import { datasetsStore, loadData } from "./datastore.js";

  let height,
    width,
    x_axis,
    y_axis,
    current_ungrouped,
    // Students of medicine 1762-1826
    medics,
    year_medics_group,
    // Students of medicine sample 1833-1846
    medics_sample,
    year_medics_sample_group,
    // Female Medical Graduates 1896-1900
    women_med_graduates,
    year_women_med_graduates_group,
    // Edinburgh Seven 1869
    edinburgh_seven,
    year_edinburgh_seven_group,
    // Extra Academic Students 1887-1922
    extra_academic,
    year_extra_academic_group,
    // First Matriculations 1890-1899
    matriculations,
    matriculations_medics,
    year_matriculations_group,
    // Women Doctors
    women_doctors,
    year_women_doctors_group,
    // Women physiology
    women_physiology,
    year_women_physiology_group,
    // St Andrews/Edinburgh students 1579-1897
    st_andrews,
    alumni_geocoded,
    year_st_andrews_group,
    // Combined datasets
    all_grouped,
    full_years,
    all_medics,
    all_medics_grouped,
    all_medics_separated,
    all_women_medics,
    all_women_medics_grouped,
    // Students at New College 1843-1943
    new_college,
    year_college_group,
    // Veterinary
    veterinary,
    year_veterinary_group,
    veterinary_graduates,
    year_veterinary_graduates_group,
    // Geo layers
    colonies_1885,
    five_days,
    ten_days,
    twenty_days,
    // student numbers
    students_1836_1920,
    women_1914_1965,
    margin = { top: 20, right: 30, bottom: 30, left: 40 };

  onMount(() => {
    const unsubscribe = datasetsStore.subscribe((data) => {
      if (!data) return;

      ({
        // Students of medicine 1762-1826
        medics,
        year_medics_group,

        // Students of medicine sample 1833-1846
        medics_sample,
        year_medics_sample_group,

        // Female Medical Graduates 1896-1900
        women_med_graduates,
        year_women_med_graduates_group,

        // Edinburgh Seven 1869
        edinburgh_seven,
        year_edinburgh_seven_group,

        // Extra Academic Students 1887-1922
        extra_academic,
        year_extra_academic_group,

        // First Matriculations 1890-1899
        matriculations_medics,
        year_matriculations_group,

        // Women Doctors
        women_doctors,
        year_women_doctors_group,

        // Women physiology
        women_physiology,
        year_women_physiology_group,

        // St Andrews/Edinburgh students 1579-1897
        st_andrews,
        year_st_andrews_group,

        // Combined datasets
        all_grouped,
        full_years,
        all_medics,
        all_medics_grouped,
        all_medics_separated,
        all_women_medics,
        all_women_medics_grouped,

        // Students at New College 1843-1943
        new_college,
        year_college_group,

        // Veterinary
        veterinary,
        year_veterinary_group,
        veterinary_graduates,
        year_veterinary_graduates_group,

        // Geo layers
        colonies_1885,
        five_days,
        ten_days,
        twenty_days,

        //student numbers
        students_1836_1920,
        women_1914_1965,
      } = data);

      current_ungrouped = all_medics;
    });
    loadData();
    return unsubscribe;
  });

  $: data_to_draw = all_medics_grouped;
  let activeKey = "all_medics";

  $: datasets = {
    all_medics: all_medics_grouped,
    all_women_medics: all_women_medics_grouped,
    medics: year_medics_group,
    matriculations_medics: year_matriculations_group,
    women_med_graduates: year_women_med_graduates_group,
    women_doctors: year_women_doctors_group,
    women_physiology: year_women_physiology_group,
    medics_sample: year_medics_sample_group,
    extra_academic: year_extra_academic_group,
    edinburgh_seven: year_edinburgh_seven_group,
    all_uni: all_grouped,
    st_andrews: year_st_andrews_group,
  };

  $: percentage_datasets = {
    all_medics,
    all_women_medics,
    medics,
    medics_sample,
    matriculations_medics,
    women_med_graduates,
    women_doctors,
    extra_academic,
    edinburgh_seven,
    women_physiology,
  };

  function handleSwitch(key) {
    current_ungrouped = percentage_datasets[key];
    activeKey = key;
    data_to_draw = datasets[key];
  }

  let open = false;
  let selected = "all_medics";

  const options = [
    { id: "all_medics", label: "All Medics" },
    { id: "all_women_medics", label: "All Women Medics" },
    { id: "medics", label: "Medical Students (1762-1826)" },
    {
      id: "matriculations_medics",
      label: "Medical Matriculations (1890-1899)",
    },
    { id: "women_med_graduates", label: "Medical Women Graduates (1896-1900)" },
    { id: "women_doctors", label: "Women Doctors" },
    { id: "women_physiology", label: "Women Physiology" },
    { id: "medics_sample", label: "Medics Sample (1833-1846)" },
    { id: "extra_academic", label: "Extra Medics (1887-1922)" },
    { id: "edinburgh_seven", label: "Edinburgh Seven (1869)" },
    { id: "all_uni", label: "All University" },
    { id: "st_andrews", label: "St Andrews/Edinburgh Students (1579-1897)" },
  ];

  let mapVisible = false;

  function toggleMap() {
    mapVisible = !mapVisible;
  }

  $: if (selected !== "medics_sample" && selected !== "matriculations_medics")
    mapVisible = false;

  function toggleMenu() {
    open = !open;
  }

  function select(option) {
    selected = option;
    handleSwitch(option);
    open = false;
  }

  $: selectedLabel = options.find((o) => o.id === selected)?.label;
  $: console.log(selected);
  

</script>

<svelte:window on:click={() => (open = false)} />
<main bind:clientHeight={height}>
  {#if selected === "medics_sample" || selected === "matriculations_medics"}
    <button class="map-toggle" on:click|stopPropagation={toggleMap}>
      <img src="./img/world.svg" alt="Map icon" />
      {mapVisible ? "Hide Map" : "Show Map"}
    </button>
  {/if}
  {#if selected === "all_women_medics"}
    <a
      class="women-doctors"
      href="https://tvancisin.github.io/women_medics/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open Women Medics site"
    >Web
    </a>
  {/if}

  <div class="timeline-panel" bind:clientWidth={width}>
    {#if mapVisible == false}
      <div class="dropdown">
        <button class="dropdown-toggle" on:click|stopPropagation={toggleMenu}>
          {selectedLabel} ▾
        </button>

        {#if open}
          <div class="dropdown-menu">
            {#each options as option}
              <button
                class:selected={option.id === selected}
                on:click={() => select(option.id)}
              >
                {option.label}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <Timeline
      {data_to_draw}
      {year_medics_group}
      {all_medics_separated}
      {students_1836_1920}
      {women_1914_1965}
      {height}
      {width}
      {margin}
      {full_years}
      {mapVisible}
      {activeKey}
      bind:x_axis
      bind:y_axis
    />
  </div>

  <div class="side-panel">
    <div class="percentages-panel">
      {#if current_ungrouped != undefined}
        <Details {percentage_datasets} {activeKey} {current_ungrouped} />
      {/if}
    </div>
  </div>
  {#if medics_sample}
    <Map
      {medics_sample}
      {matriculations_medics}
      {colonies_1885}
      {five_days}
      {ten_days}
      {twenty_days}
      selected_key={selected}
      visible={mapVisible}
    />
  {/if}
</main>

<style>
  main {
    position: relative;
    display: grid;
    grid-template-columns: 75% 25%;
    height: 100vh;
    width: 100vw;
    z-index: 9999;
  }

  .timeline-panel {
    position: relative;
    height: 100%;
    width: 100%;
  }

  .side-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    width: 100%;
    padding: 10px 14px;
    box-sizing: border-box;
    z-index: 2;
  }

  .percentages-panel {
    flex: 1;
    min-height: 0;
    width: 100%;
  }

  .women-doctors {
    position: absolute;
    z-index: 10;
    top: 45px;
    right: 25.5%;
    z-index: 10;
    width: 36px;
    height: 36px;
  }

  .map-toggle {
    position: absolute;
    top: 45px;
    right: 25.5%;
    z-index: 10;
    font-family: "Montserrat", sans-serif;
    font-weight: 600;
    font-size: 0.78rem;
    appearance: none;
    background: rgb(0, 0, 0);
    color: #eaeaea;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    padding: 5px 12px;
    cursor: pointer;
    transition: background 0.15s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .map-toggle img {
    width: 36px;
    height: 36px;
    filter: brightness(0.9);
  }

  .dropdown {
    position: absolute;
    top: 5px;
    left: 5px;
    z-index: 10;
    width: 400px;
  }

  .dropdown-toggle {
    font-family: "Montserrat", sans-serif;
    font-weight: 600;
    width: 100%;
    appearance: none;
    background: rgba(255, 255, 255, 0.08);
    color: #eaeaea;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    padding: 8px 14px;
    cursor: pointer;
  }

  .dropdown-menu {
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    background: rgba(20, 20, 20, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 6px;
    backdrop-filter: blur(6px);
    width: 100%;
    overflow: hidden;
  }

  .dropdown-menu button {
    font-family: "Montserrat", sans-serif;
    appearance: none;
    background: transparent;
    color: #eaeaea;
    border: none;
    padding: 8px 14px;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .dropdown-menu button:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .dropdown-menu button.selected {
    background: rgba(255, 255, 255, 0.18);
    border-left: 3px solid #4da3ff;
    padding-left: 11px; /* compensate for border */
  }
</style>
