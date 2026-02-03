<script>
  import * as d3 from "d3";
  import "./lib/d3.sketchy.js";
  import { onMount } from "svelte";
  import { getCSV, medical_terms } from "./utils.js";

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
      "../1762_1826_medical.csv",
      "../new_college_students.csv",
      "../early_veterinary.csv",
      "../veterinary_graduates.csv",
      "../matriculations.csv",
      "../extra_academic.csv",
      "../female_graduates.csv",
      "../edinburgh_seven.csv",
      "../medics_sample.csv",
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

    // medics sample data
    medics_sample = medics_sample.map((d) => ({
      ...d,
      entry_year: +d.entry_year,
    }));
    medics_sample = medics_sample.filter((d) => !Number.isNaN(d.entry_year));
    year_medics_sample_group = d3
      .groups(medics_sample, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);

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

    // women medical graduates
    women_med_graduates = women_med_graduates.map((d) => ({
      ...d,
      entry_year: +d.entry_year.slice(0, -6),
    }));
    year_women_med_graduates_group = d3
      .groups(women_med_graduates, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);

    // edinburgh 7
    edinburgh_seven = edinburgh_seven.map((d) => ({
      ...d,
      entry_year: +d.entry_year,
    }));
    year_edinburgh_seven_group = d3
      .groups(edinburgh_seven, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);

    // // new college data
    // new_college = new_college.map((d) => ({
    //   ...d,
    //   entry_year: +d.entry_year,
    // }));
    // year_college_group = d3
    //   .groups(new_college, (d) => d.entry_year)
    //   .filter((d) => d[0] != null && !Number.isNaN(d[0]))
    //   .sort((a, b) => a[0] - b[0]);

    // // veterinary data
    // veterinary = veterinary.map((d) => ({
    //   ...d,
    //   entry_year: +d.entry_year,
    // }));
    // year_veterinary_group = d3
    //   .groups(veterinary, (d) => d.entry_year)
    //   .sort((a, b) => a[0] - b[0]);

    // // veterinary graduates data
    // veterinary_graduates = veterinary_graduates
    //   .filter((d) => +d.entry_year >= 1762)
    //   .map((d) => ({
    //     ...d,
    //     entry_year: +d.entry_year,
    //   }));
    // year_veterinary_graduates_group = d3
    //   .groups(veterinary_graduates, (d) => d.entry_year)
    //   .sort((a, b) => a[0] - b[0]);

    // all data
    // let all = [
    //   ...medics,
    //   ...new_college,
    //   ...veterinary,
    //   ...veterinary_graduates,
    //   ...matriculations,
    //   ...extra_academic,
    //   ...women_med_graduates,
    //   ...edinburgh_seven,
    //   ...medics_sample,
    // ];
    // all_grouped = d3
    //   .groups(all, (d) => d.entry_year)
    //   .filter((d) => d[0] != null && !Number.isNaN(d[0]))
    //   .sort((a, b) => a[0] - b[0]);

    let all_medics = [
      ...medics,
      ...medics_sample,
      ...matriculations,
      ...women_med_graduates,
      ...edinburgh_seven,
    ];
    all_medics_grouped = d3
      .groups(all_medics, (d) => d.entry_year)
      .filter((d) => d[0] != null && !Number.isNaN(d[0]))
      .filter((d) => d[0] >= 1762)
      .sort((a, b) => a[0] - b[0]);

    // empty years array
    const dataMap = new Map(
      all_medics_grouped.map(([year, values]) => [year, values]),
    );

    const START_YEAR = 1726;
    const END_YEAR = 2025;
    const populatedData = [];
    for (let year = START_YEAR; year <= END_YEAR; year++) {
      populatedData.push([
        year,
        dataMap.get(year) ?? [], // use existing array or empty array
      ]);
    }

    full_years = populatedData.map((d) => ({
      year: d[0],
      certainty: "uncertain",
      count: Math.random() * 400,
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

  // diagonal uncertainty lines
  // const nLines = 10;
  // $: lines = Array.from({ length: nLines }, (_, i) => {
  //   const t = i / (nLines - 1); // 0 → 1
  //   return {
  //     x1: xStart + t * (xEnd - xStart),
  //     x2: xStart + t * (xEnd - xStart) + 100,
  //   };
  // });

  // --- sketchy rectangle generator ---
  function generateSketchyRect({
    x,
    y,
    width,
    height,
    density = 4,
    sketch = 1,
    angle = 45,
  }) {
    const lines = [];
    const rad = (Math.PI / 180) * angle;
    const dx = density * Math.cos(rad);
    const dy = density * Math.sin(rad);

    // simple diagonal line filling logic
    for (let i = 0; i < width + height; i += density) {
      // slightly jitter start and end points for sketchiness
      const jitter = () => (Math.random() - 0.5) * sketch;

      let x1 = x + i * 0.5 + jitter();
      let y1 = y + i * 0.5 + jitter();
      let x2 = x + i * 0.5 + jitter();
      let y2 = y + height - i * 0.5 + jitter();

      // clip to rectangle bounds
      x1 = Math.min(Math.max(x1, x), x + width);
      x2 = Math.min(Math.max(x2, x), x + width);
      y1 = Math.min(Math.max(y1, y), y + height);
      y2 = Math.min(Math.max(y2, y), y + height);

      lines.push(`M${x1},${y1} L${x2},${y2}`);
    }

    return lines.join(" ");
  }

  $: console.log(all_medics_grouped);
</script>

<main bind:clientHeight={height} bind:clientWidth={width}>
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

      <!-- all medics available data -->
      {#each all_medics_grouped as [year, entries]}
        <rect
          x={x_scale(new Date(year, 0, 1))}
          y={y_scale(entries.length)}
          width={2}
          height={height - margin.bottom - y_scale(entries.length)}
          fill="gray"
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

      <!-- charles darwin -->
      <circle
        cx={x_scale(new Date(1825, 0, 1)) + 1}
        cy={y_scale(370)}
        r={3}
        fill="white"
      />

      <!-- edinburgh seven -->
      <circle
        cx={x_scale(new Date(1869, 0, 1)) + 1}
        cy={y_scale(15)}
        r={3}
        fill="white"
      />

      <!-- {#each lines as d}
        <line
          x1={d.x1}
          y1={height - 50}
          x2={d.x2}
          y2={50}
          stroke="gray"
          stroke-opacity="0.5"
          stroke-dasharray="10 5"
        />
      {/each} -->

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
</style>
