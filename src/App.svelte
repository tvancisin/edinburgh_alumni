<script>
  import * as d3 from "d3";
  import "./lib/d3.sketchy.js";
  import { onMount } from "svelte";
  import Map from "./components/Map.svelte";
  import Timeline from "./components/Timeline.svelte";
  import Percentages from "./components/Percentages.svelte";
  import { datasetsStore, loadData } from "./datastore.js";

  let height,
    width,
    x_axis,
    y_axis,
    current_ungrouped,
    all_grouped,
    all_medics,
    all_medics_grouped,
    medics,
    new_college,
    veterinary,
    matriculations,
    veterinary_graduates,
    extra_academic,
    women_med_graduates,
    edinburgh_seven,
    medics_sample,
    st_andrews,
    alumni_geocoded,
    year_st_andrews_group,
    full_years,
    year_medics_group,
    year_college_group,
    year_veterinary_group,
    year_veterinary_graduates_group,
    year_matriculations_group,
    year_extra_academic_group,
    year_women_med_graduates_group,
    year_edinburgh_seven_group,
    year_medics_sample_group,
    matriculations_medics,
    colonies_1885,
    margin = { top: 20, right: 30, bottom: 30, left: 40 };

  onMount(() => {
    const unsubscribe = datasetsStore.subscribe((data) => {
      if (!data) return;

      ({
        medics,
        new_college,
        veterinary,
        matriculations,
        veterinary_graduates,
        extra_academic,
        women_med_graduates,
        edinburgh_seven,
        medics_sample,
        st_andrews,
        year_st_andrews_group,
        full_years,
        year_medics_group,
        year_college_group,
        year_veterinary_group,
        year_veterinary_graduates_group,
        year_matriculations_group,
        year_extra_academic_group,
        year_women_med_graduates_group,
        year_edinburgh_seven_group,
        year_medics_sample_group,
        all_grouped,
        all_medics,
        all_medics_grouped,
        matriculations_medics,
        colonies_1885,
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
    medics: year_medics_group,
    matriculations: year_matriculations_group,
    women_med_graduates: year_women_med_graduates_group,
    medics_sample: year_medics_sample_group,
    extra_academic: year_extra_academic_group,
    edinburgh_seven: year_edinburgh_seven_group,
    all_uni: all_grouped,
    st_andrews: year_st_andrews_group,
  };

  $: percentage_datasets = {
    all_medics,
    medics,
    medics_sample,
    matriculations,
    extra_academic,
    women_med_graduates,
    edinburgh_seven,
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
    { id: "medics", label: "Medical Students (1762-1826)" },
    { id: "matriculations", label: "Medical Matriculations (1890-1899)" },
    { id: "women_med_graduates", label: "Medical Women Graduates (1896-1900)" },
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

  $: if (selected !== "medics_sample" && selected !== "matriculations")
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
  
</script>

<svelte:window on:click={() => (open = false)} />
<main bind:clientHeight={height}>
  {#if selected === "medics_sample" || selected === "matriculations"}
    <button class="map-toggle" on:click|stopPropagation={toggleMap}>
      {mapVisible ? "Hide Map" : "Show Map"}
    </button>
  {/if}

  <div class="timeline-panel" bind:clientWidth={width}>
    <Timeline
      {data_to_draw}
      {year_medics_group}
      {height}
      {width}
      {margin}
      {full_years}
      {mapVisible}
      {activeKey}
      bind:x_axis
      bind:y_axis
    />
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
  </div>

  <div class="side-panel">
    <div class="percentages-panel">
      {#if current_ungrouped != undefined}
        <Percentages {percentage_datasets} {activeKey} {current_ungrouped} />
      {/if}
    </div>
  </div>
  {#if medics_sample}
    <Map
      {medics_sample}
      {matriculations_medics}
      {colonies_1885}
      selected_key={selected}
      visible={mapVisible}
    />
  {/if}
</main>

<style>
  main {
    position: relative;
    display: grid;
    grid-template-columns: 60% 40%;
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

  .map-toggle {
    position: absolute;
    top: 45px;
    right: 40.5%;
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
