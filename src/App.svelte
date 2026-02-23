<script>
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
      } = data);
    });

    loadData();

    return unsubscribe;
  });

  $: data_to_draw = all_medics_grouped;
  let activeKey = "medics";

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
    activeKey = key;
    data_to_draw = datasets[key];
  }

  let open = false;
  let selected = "all_medics";

  const options = [
    { id: "all_medics", label: "All Medics" },
    { id: "medics", label: "Medical Students" },
    { id: "matriculations", label: "Medical Matriculations" },
    { id: "women_med_graduates", label: "Medical Women Graduates" },
    { id: "medics_sample", label: "Medics Sample" },
    { id: "extra_academic", label: "Extra Medics" },
    { id: "edinburgh_seven", label: "Edinburgh Seven" },
    { id: "all_uni", label: "All University" },
    { id: "st_andrews", label: "St Andrews Dataset" },
  ];

  let mapVisible = false;

  function toggleMap() {
    mapVisible = !mapVisible;
  }

  $: if (selected !== "medics_sample") mapVisible = false;

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
<main bind:clientHeight={height} bind:clientWidth={width}>
  {#if selected === "medics_sample"}
    <button class="map-toggle" on:click|stopPropagation={toggleMap}>
      {mapVisible ? "Hide Map" : "Show Map"}
    </button>
  {/if}

  {#if mapVisible == false}
    <h1>University of Edinburgh Historical Student Records</h1>
    <div class="dropdown" on:click|stopPropagation>
      <button class="dropdown-toggle" on:click={toggleMenu}>
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

    <Percentages {percentage_datasets} {activeKey} />
  {/if}
  {#if medics_sample}
    <Map {medics_sample} visible={mapVisible} />
  {/if}

  <Timeline
    {year_medics_group}
    {height}
    {width}
    {margin}
    {full_years}
    {mapVisible}
    {data_to_draw}
    {activeKey}
    bind:x_axis
    bind:y_axis
  />
</main>

<style>
  main {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
    z-index: 9999;
  }

  h1 {
    position: absolute;
    top: 5px;
    left: 10px;
    font-size: 20px;
    font-weight: 700;
  }

  .map-toggle {
    position: absolute;
    top: 50px;
    right: 10px;
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
    top: 10px;
    right: 10px;
    z-index: 10;
    width: 240px;
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
