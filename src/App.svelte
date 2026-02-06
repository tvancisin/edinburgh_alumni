<script>
  import * as d3 from "d3";
  import "./lib/d3.sketchy.js";
  import { Tween } from "svelte/motion";
  import { cubicInOut } from "svelte/easing";
  import { onMount } from "svelte";
  import Bars from "./Bars.svelte";
  import {
    getCSV,
    medical_terms,
    generateSketchyRect,
    fillMissingYears,
    groupByYear,
  } from "./utils.js";

  let svgEl; // bind to your <svg>

  let height,
    width,
    x_scale,
    x_axis,
    x_axis_1,
    y_scale,
    y_scale_all,
    y_axis,
    all_grouped,
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
  onMount(async () => {
    // load the data
    [
      medics,
      new_college,
      veterinary,
      veterinary_graduates,
      matriculations,
      extra_academic,
      women_med_graduates,
      edinburgh_seven,
      medics_sample,
    ] = await getCSV([
      "./1762_1826_medical.csv",
      "./new_college_students.csv",
      "./early_veterinary.csv",
      "./veterinary_graduates.csv",
      "./matriculations.csv",
      "./extra_academic.csv",
      "./female_graduates.csv",
      "./edinburgh_seven.csv",
      "./medics_sample.csv",
    ]);

    // medics data
    medics = medics
      .filter((d) => +d.entry_year >= 1762)
      .map((d) => ({
        ...d,
        entry_year: +d.entry_year,
      }));
    year_medics_group = d3
      .groups(medics, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);
    year_medics_group = fillMissingYears(year_medics_group, 1762, 2025);

    // medics sample data
    medics_sample = medics_sample.map((d) => ({
      ...d,
      entry_year: +d.entry_year,
    }));
    medics_sample = medics_sample.filter((d) => !Number.isNaN(d.entry_year));
    year_medics_sample_group = d3
      .groups(medics_sample, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);
    year_medics_sample_group = fillMissingYears(
      year_medics_sample_group,
      1762,
      2025,
    );

    // medics matriculations data
    matriculations = matriculations.map((d) => ({
      ...d,
      entry_year: +d.entry_year.slice(0, -3),
    }));
    matriculations = matriculations.filter((d) => d.Faculty === "Medicine");
    year_matriculations_group = d3
      .groups(matriculations, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);
    year_matriculations_group = year_matriculations_group.filter(
      ([year]) => Number.isFinite(year) && year >= 1700 && year <= 2025,
    );
    year_matriculations_group = fillMissingYears(
      year_matriculations_group,
      1700,
      2025,
    );

    // extra medics academic data
    extra_academic = extra_academic.filter((d) =>
      medical_terms.some((term) =>
        d.Class.toLowerCase().includes(term.toLowerCase()),
      ),
    );
    extra_academic = extra_academic.map((d) => ({
      ...d,
      entry_year: +d.entry_year.slice(0, -5),
      no_space_name: d.name.replace(/\s+/g, ""),
    }));
    let final_extra_academics = d3.groups(
      extra_academic,
      (d) => d.no_space_name,
    );
    final_extra_academics = final_extra_academics.map((d) => {
      d[1].sort((a, b) => a.entry_year - b.entry_year);
      return d;
    });
    final_extra_academics = final_extra_academics.map((d) => ({
      ...d,
      name: d[1][0].name,
      tha_year: d[1][0].entry_year,
    }));
    year_extra_academic_group = d3
      .groups(final_extra_academics, (d) => d.tha_year)
      .sort((a, b) => a[0] - b[0]);
    year_extra_academic_group = fillMissingYears(
      year_extra_academic_group,
      1762,
      2025,
    );

    // women medical graduates
    women_med_graduates = women_med_graduates.map((d) => ({
      ...d,
      entry_year: +d.entry_year.slice(0, -6),
    }));
    year_women_med_graduates_group = d3
      .groups(women_med_graduates, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);
    year_women_med_graduates_group = fillMissingYears(
      year_women_med_graduates_group,
      1762,
      2025,
    );

    // edinburgh 7
    edinburgh_seven = edinburgh_seven.map((d) => ({
      ...d,
      entry_year: +d.entry_year,
    }));
    year_edinburgh_seven_group = d3
      .groups(edinburgh_seven, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);
    year_edinburgh_seven_group = fillMissingYears(
      year_edinburgh_seven_group,
      1762,
      2025,
    );

    let all_medics = [
      ...medics,
      ...medics_sample,
      ...matriculations,
      ...extra_academic,
      ...women_med_graduates,
      ...edinburgh_seven,
    ];

    all_medics_grouped = d3
      .groups(all_medics, (d) => d.entry_year)
      .filter((d) => d[0] != null && !Number.isNaN(d[0]))
      .filter((d) => d[0] >= 1762)
      .sort((a, b) => a[0] - b[0]);

    all_medics_grouped = fillMissingYears(all_medics_grouped, 1762, 2025);

    // new college data
    new_college = new_college.map((d) => ({
      ...d,
      entry_year: +d.entry_year,
    }));
    year_college_group = d3
      .groups(new_college, (d) => d.entry_year)
      .filter((d) => d[0] != null && !Number.isNaN(d[0]))
      .sort((a, b) => a[0] - b[0]);
    year_college_group = fillMissingYears(year_college_group, 1762, 2025);

    // veterinary data
    veterinary = veterinary.map((d) => ({
      ...d,
      entry_year: +d.entry_year,
    }));
    year_veterinary_group = d3
      .groups(veterinary, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);
    year_veterinary_group = fillMissingYears(year_veterinary_group, 1762, 2025);

    // veterinary graduates data
    veterinary_graduates = veterinary_graduates
      .filter((d) => +d.entry_year >= 1762)
      .map((d) => ({
        ...d,
        entry_year: +d.entry_year,
      }));
    year_veterinary_graduates_group = d3
      .groups(veterinary_graduates, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);

    // all data
    let all = [
      ...medics,
      ...new_college,
      ...veterinary,
      ...veterinary_graduates,
      ...matriculations,
      ...extra_academic,
      ...women_med_graduates,
      ...edinburgh_seven,
      ...medics_sample,
    ];
    all_grouped = d3
      .groups(all, (d) => d.entry_year)
      .filter((d) => d[0] != null && !Number.isNaN(d[0]))
      .sort((a, b) => a[0] - b[0]);
    all_grouped = fillMissingYears(all_grouped, 1726, 2025);

    // uncertainty years
    full_years = all_grouped.map((d) => ({
      year: d[0],
      certainty: "uncertain",
      count: 200 + (Math.random() + Math.random()) * 300,
      // make years that are certain starting point for drawing uncertain rects but maybe make uncertainty there lower
    }));
  });

  let xStart, xEnd;
  $: if (year_medics_group) {
    x_scale = d3
      .scaleTime()
      .domain([new Date(1582, 0, 1), new Date(2025, 0, 1)])
      .range([margin.left, width - margin.right]);

    y_scale = d3
      .scaleLinear()
      .domain([0, d3.max(year_medics_group, (d) => d[1].length)])
      .range([height - margin.bottom, margin.top])
      .nice();
    xStart = x_scale(new Date(1726, 0, 1));
    xEnd = x_scale(new Date(2025, 0, 1));
  }

  $: if (x_axis) {
    const axis = d3
      .axisBottom(x_scale)
      .ticks(d3.timeYear.every(20))
      .tickFormat(d3.timeFormat("%Y"))
      .tickSizeOuter(0);

    d3.select(x_axis)
      .call(axis)
      .selectAll("text")
      .attr("fill", "white")
      .attr("font-family", "Montserrat, sans-serif")
      .attr("font-weight", 400)
      .attr("font-size", 12)
      .attr("text-anchor", "middle");

    d3.select(x_axis)
      .select("path.domain")
      .attr("stroke", "gray")
      .attr("stroke-width", 1);

    d3.select(x_axis)
      .selectAll("line")
      .attr("stroke", "gray")
      .attr("stroke-width", 1);
  }

  $: baseY = height / 2 - 45;
  const gap = 30;
  const schools = [
    { name: "Law", year: 1707, labelOffset: 75 },
    { name: "Arts", year: 1708, labelOffset: 75 },
    { name: "Medicine", year: 1726, labelOffset: 105 },
    { name: "Veterinary", year: 1823, labelOffset: 110 },
    { name: "New College", year: 1843, labelOffset: 130 },
  ];

  $: data_to_draw = all_medics_grouped;
  let activeKey = "all";

  $: datasets = {
    all: all_medics_grouped,
    medics: year_medics_group,
    matriculations: year_matriculations_group,
    women: year_women_med_graduates_group,
    sample: year_medics_sample_group,
    extra: year_extra_academic_group,
    seven: year_edinburgh_seven_group,
    all_uni: all_grouped,
  };

  function handleSwitch(key) {
    activeKey = key;
    data_to_draw = datasets[key];
  }
  
</script>

<main bind:clientHeight={height} bind:clientWidth={width}>
  <h1>University of Edinburgh Historical Student Records</h1>
  <div class="button-column">
    <button on:click={() => handleSwitch("all")}>All Medics</button>
    <button on:click={() => handleSwitch("medics")}>Medical Students</button>
    <button on:click={() => handleSwitch("matriculations")}>Matriculations</button>
    <button on:click={() => handleSwitch("women")}>Women Graduates</button>
    <button on:click={() => handleSwitch("sample")}>Medics Sample</button>
    <button on:click={() => handleSwitch("extra")}>Extra</button>
    <button on:click={() => handleSwitch("seven")}>Edinburgh Seven</button>
    <button id="all_uni" on:click={() => handleSwitch("all_uni")}
      >All University</button
    >
  </div>

  {#if year_medics_group}
    <svg bind:this={svgEl} {height} {width}>
      <defs>
        <linearGradient id="uncertaintyFade" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="gray" stop-opacity="0.4" />
          <stop offset="100%" stop-color="gray" stop-opacity="0" />
        </linearGradient>
      </defs>
      <g
        transform={`translate(0,${height - margin.bottom})`}
        bind:this={x_axis}
      />

      <!-- uncertainty years  -->
      {#each full_years as d}
        <rect
          x={x_scale(new Date(d.year, 0, 1))}
          y={y_scale(d.count)}
          width={2}
          height={height - margin.bottom - y_scale(d.count)}
          fill={d.certainty === "uncertain" ? "url(#uncertaintyFade)" : "white"}
          fill-opacity="0.7"
        />
      {/each}

      {#each data_to_draw as [year, entries], i (year)}
        <Bars
          x={x_scale(new Date(year, 0, 1))}
          value={entries.length}
          yScale={y_scale}
          width={2}
          {height}
          marginBottom={margin.bottom}
          fill="gray"
          {i}
        />
      {/each}

      <!-- medical school establishment -->
      <rect
        x={x_scale(new Date(1726, 0, 1))}
        y={y_scale(200)}
        width={1}
        height={height - margin.bottom - y_scale(200)}
        fill="orange"
      />
      <text
        x={x_scale(new Date(1726, 0, 1))}
        y={y_scale(200) - 10}
        fill="white"
        text-anchor="end"
        font-family="Montserrat, sans-serif"
        font-weight="300"
        font-size="14">Medical School Established (1726)</text
      >

      {#if activeKey === "all"}
        <!-- Charles Darwin -->
        <g>
          <circle
            cx={x_scale(new Date(1825, 0, 1)) + 1}
            cy={y_scale(370)}
            r={3}
            fill="white"
          />
          <text
            x={x_scale(new Date(1825, 0, 1)) + 8}
            y={y_scale(370) + 4}
            font-size="14"
            font-family="Montserrat, sans-serif"
            font-weight="300"
            fill="white"
          >
            Charles Darwin
          </text>
        </g>

        <!-- Edinburgh Seven -->
        <g>
          <circle
            cx={x_scale(new Date(1869, 0, 1)) + 1}
            cy={y_scale(15)}
            r={3}
            fill="white"
          />
          <text
            x={x_scale(new Date(1869, 0, 1)) + 8}
            y={y_scale(15) + 4}
            font-size="14"
            font-family="Montserrat, sans-serif"
            font-weight="300"
            fill="white"
          >
            Edinburgh Seven
          </text>
        </g>
      {/if}

      <!-- {#each year_medics_group as [year, entries]}
        <path
          d={generateSketchyRect({
            x: x_scale(new Date(year, 0, 1)),
            y: y_scale(entries.length),
            width: 2,
            height: height - margin.bottom - y_scale(entries.length),
            density: 3,
            sketch: 10,
            angle: 45,
          })}
          stroke="steelblue"
          fill="none"
          stroke-width="1"
        />
      {/each} -->

      <!-- {#each year_medics_group as [year, entries]}
        <rect
          x={x_scale(new Date(year, 0, 1))}
          y={y_scale(entries.length)}
          width={2}
          height={height - margin.bottom - y_scale(entries.length)}
          fill="steelblue"
        />
      {/each}


      {#each year_medics_sample_group as [year, entries]}
        <rect
          x={x_scale(new Date(year, 0, 1))}
          y={y_scale(entries.length)}
          width={2}
          height={height - margin.bottom - y_scale(entries.length)}
          fill="steelblue"
        />
      {/each}

      {#each year_matriculations_group as [year, entries]}
        <rect
          x={x_scale(new Date(year, 0, 1))}
          y={y_scale(entries.length)}
          width={2}
          height={height - margin.bottom - y_scale(entries.length)}
          fill="steelblue"
        />
      {/each}

      {#each year_extra_academic_group as [name, entries]}
        <rect
          x={x_scale(new Date(entries[0].tha_year, 0, 1))}
          y={y_scale(entries.length)}
          width={2}
          height={height - margin.bottom - y_scale(entries.length)}
          fill="orange"
        />
      {/each}

      {#each year_women_med_graduates_group as [year, entries]}
        <rect
          x={x_scale(new Date(year, 0, 1))}
          y={y_scale(entries.length)}
          width={2}
          height={height - margin.bottom - y_scale(entries.length)}
          fill="yellow"
        />
      {/each}

      {#each year_edinburgh_seven_group as [year, entries]}
        <rect
          x={x_scale(new Date(year, 0, 1))}
          y={y_scale(entries.length)}
          width={2}
          height={height - margin.bottom - y_scale(entries.length)}
          fill="steelblue"
        />
      {/each} -->

      <!-- historical events -->
      <!-- <text
        x={x_scale(new Date(1582, 0, 1)) + 5}
        y={height - 40}
        fill="white"
        font-family="Inter, sans-serif"
        font-weight="600"
        font-size="14">University Established (1583)</text
      >

      <rect
        x={x_scale(new Date(1726, 0, 1))}
        y={y_scale(500)}
        width={1}
        height={height - margin.bottom - y_scale(500)}
        fill="gray"
      />
      <text
        x={x_scale(new Date(1726, 0, 1)) + 5}
        y={y_scale(500) - 10}
        fill="white"
        font-family="Inter, sans-serif"
        font-weight="300"
        font-size="14">Medical School (1726)</text
      > -->

      <!-- edinburgh seven -->
      <!-- <rect
        x={x_scale(new Date(1869, 0, 1))}
        y={y_scale(500)}
        width={1}
        height={height - margin.bottom - y_scale(470)}
        fill="gray"
      />
      <text
        x={x_scale(new Date(1869, 0, 1)) + 5}
        y={y_scale(500) - 10}
        fill="white"
        font-family="Inter, sans-serif"
        font-weight="300"
        font-size="14">Edinburgh Seven (1869)</text
      > -->

      <!-- {#each year_medics_group as [year, entries]}
        <rect
          x={x_scale(new Date(year, 0, 1))}
          y={y_scale(entries.length) - 75}
          width={2}
          height={height / 2 - margin.bottom - y_scale(entries.length)}
          fill="steelblue"
        />
      {/each}
      {#each year_college_group as [year, entries]}
        <rect
          x={x_scale(new Date(year, 0, 1))}
          y={y_scale(entries.length) - 135}
          width={2}
          height={height / 2 - margin.bottom - y_scale(entries.length)}
          fill="orange"
        />
      {/each}
      {#each year_veterinary_group as [year, entries]}
        <rect
          x={x_scale(new Date(year, 0, 1))}
          y={y_scale(entries.length) - 105}
          width={2}
          height={height / 2 - margin.bottom - y_scale(entries.length)}
          fill="white"
        />
      {/each}
      {#each year_veterinary_graduates_group as [year, entries]}
        <rect
          x={x_scale(new Date(year, 0, 1))}
          y={y_scale(entries.length) - 105}
          width={2}
          height={height / 2 - margin.bottom - y_scale(entries.length)}
          fill="white"
        />
      {/each}
      {#each year_matriculations_group as [year, entries]}
        <rect
          x={x_scale(new Date(year, 0, 1))}
          y={y_scale(entries.length) + 15}
          width={2}
          height={height / 2 - margin.bottom - y_scale(entries.length)}
          fill="gray"
        />
      {/each} -->

      <!-- {#each schools as s, i}
        <rect
          x={x_scale(new Date(s.year, 0, 1))}
          y={baseY - i * gap}
          width={x_scale(new Date(2025, 0, 1)) -
            x_scale(new Date(s.year, 0, 1))}
          height={0.5}
          fill="white"
        />

        <text
          x={x_scale(new Date(s.year, 0, 1)) - s.labelOffset}
          y={baseY - i * gap - 5}
          fill="white"
          font-family="Inter, sans-serif"
          font-weight="600"
          font-size="14"
        >
          {s.name} ({s.year})
        </text>
      {/each} -->

      <!-- University Established -->
      <!-- <rect
        x={x_scale(new Date(1583, 0, 1))}
        y={y_scale(500)}
        width={1}
        height={height - margin.bottom - y_scale(500)}
        fill="gray"
      />
      <text
        x={x_scale(new Date(1583, 0, 1)) + 5}
        y={y_scale(500) - 10}
        fill="white"
        font-family="Inter, sans-serif"
        font-weight="300"
        font-size="14">University Established (1583)</text
      > -->

      <!-- edinburgh seven -->
      <!-- <rect
        x={x_scale(new Date(1869, 0, 1))}
        y={y_scale(500)}
        width={1}
        height={height - margin.bottom - y_scale(500)}
        fill="gray"
      />
      <text
        x={x_scale(new Date(1869, 0, 1)) + 5}
        y={y_scale(500) - 10}
        fill="white"
        font-family="Inter, sans-serif"
        font-weight="300"
        font-size="14">Edinburgh Seven (1869)</text
      > -->
      <!-- medical school establishment -->
      <!-- <rect
        x={x_scale(new Date(1726, 0, 1))}
        y={y_scale(500)}
        width={1}
        height={height - margin.bottom - y_scale(500)}
        fill="gray"
      />
      <text
        x={x_scale(new Date(1726, 0, 1)) + 5}
        y={y_scale(500) - 10}
        fill="white"
        font-family="Inter, sans-serif"
        font-weight="300"
        font-size="14">Medical School (1726)</text
      > -->
      <!-- infirmary/efi -->
      <!-- <rect
        x={x_scale(new Date(1880, 0, 1))}
        y={y_scale(600)}
        width={1}
        height={height - margin.bottom - y_scale(500)}
        fill="gray"
      />
      <text
        x={x_scale(new Date(1880, 0, 1)) + 5}
        y={y_scale(600) - 10}
        fill="white"
        font-family="Inter, sans-serif"
        font-weight="300"
        font-size="14">Infirmary finished (EFI) (1880)</text
      > -->
    </svg>
  {/if}
</main>

<style>
  main {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
  }

  h1 {
    position: absolute;
    top: 5px;
    left: 10px;
    font-size: 20px;
    font-weight: 700;
  }

  .button-column {
    position: absolute;
    top: 60px;
    left: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  button {
    appearance: none;
    background: rgba(255, 255, 255, 0.08);
    color: #eaeaea;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    padding: 8px 14px;
    font-family: inherit;
    font-size: 13px;
    text-align: left;

    cursor: pointer;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease,
      transform 0.1s ease;
  }

  /* hover */
  button:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.35);
  }

  button:active {
    transform: translateY(1px);
  }

  button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(100, 160, 255, 0.6);
  }

  #all_uni {
    background: rgba(109, 109, 109, 0.43);
    border-color: rgba(255, 165, 0, 0.3);
  }
</style>
