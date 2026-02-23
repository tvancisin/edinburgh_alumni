<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import Bars from "./Bars.svelte";

  export let year_medics_group;
  export let height;
  export let width;
  export let margin;
  export let full_years;
  export let mapVisible;
  export let data_to_draw;
  export let activeKey;
  export let x_axis;
  export let y_axis;

  let x_scale, y_scale;

  // Compute scales based on data and dimensions
  $: if (year_medics_group && width && height) {
    x_scale = d3
      .scaleTime()
      .domain([new Date(1582, 0, 1), new Date(2025, 0, 1)])
      .range([margin.left, width - margin.right]);

    y_scale = d3
      .scaleLinear()
      .domain([0, d3.max(year_medics_group, (d) => d[1].length)])
      .range([height - margin.bottom, margin.top])
      .nice();
  }

  // Render axes
  $: if (x_axis && x_scale) {
    const axisColor = mapVisible ? "black" : "white";
    const tickColor = mapVisible ? "black" : "gray";

    const xaxis = d3
      .axisBottom(x_scale)
      .ticks(d3.timeYear.every(20))
      .tickFormat(d3.timeFormat("%Y"))
      .tickSizeOuter(0);

    d3.select(x_axis)
      .call(xaxis)
      .selectAll("text")
      .attr("fill", axisColor)
      .attr("font-family", "Montserrat, sans-serif")
      .attr("font-weight", 400)
      .attr("font-size", 12)
      .attr("text-anchor", "middle");

    d3.select(x_axis)
      .select("path.domain")
      .attr("stroke", tickColor)
      .attr("stroke-width", 1);

    d3.select(x_axis)
      .selectAll("line")
      .attr("stroke", tickColor)
      .attr("stroke-width", 1);
  }

  $: if (y_axis && y_scale) {
    const yaxis = d3.axisLeft(y_scale).ticks(5).tickSizeOuter(0);

    d3.select(y_axis)
      .call(yaxis)
      .selectAll("text")
      .attr("fill", "white")
      .attr("font-family", "Montserrat, sans-serif")
      .attr("font-weight", 400)
      .attr("font-size", 12);

    d3.select(y_axis).select("path.domain").remove();
  }
</script>

{#if year_medics_group}
  <svg {height} {width}>
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
    <g transform={`translate(${margin.left}, 0)`} bind:this={y_axis} />

    <!-- uncertainty years  -->
    {#each full_years as d, i}
      <Bars
        x={x_scale(new Date(d.year, 0, 1))}
        value={mapVisible ? 0 : d.count}
        yScale={y_scale}
        width={2}
        {height}
        marginBottom={margin.bottom}
        fill={d.certainty === "uncertain" ? "url(#uncertaintyFade)" : "white"}
        {i}
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
        fill={mapVisible ? "black" : "#bfbfbf"}
        {i}
      />
    {/each}

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

    {#if mapVisible == false}
      <!-- historical context -->
      <text
        x={x_scale(new Date(1582, 0, 1)) + 5}
        y={y_scale(150)}
        transform={`rotate(-25 ${x_scale(new Date(1582, 0, 1)) + 5} ${y_scale(150)})`}
        fill="white"
        opacity="0.5"
        font-weight="300"
        font-size="14">University Established (1583)</text
      >

      <rect
        x={x_scale(new Date(1582, 0, 1))}
        y={y_scale(150)}
        width={1}
        height={height - margin.bottom - y_scale(150)}
        fill="orange"
        opacity="0.4"
      />

      <!-- law school -->
      <rect
        x={x_scale(new Date(1707, 0, 1))}
        y={y_scale(200)}
        width={1}
        height={height - margin.bottom - y_scale(200)}
        fill="orange"
        opacity="0.2"
      />
      <text
        x={x_scale(new Date(1707, 0, 1))}
        y={y_scale(200) - 10}
        transform={`rotate(-25 ${x_scale(new Date(1707, 0, 1)) + 5} ${y_scale(200)})`}
        fill="white"
        font-family="Montserrat, sans-serif"
        font-weight="300"
        opacity="0.5"
        font-size="14">Law School (1707)</text
      >

      <!-- art school -->
      <rect
        x={x_scale(new Date(1708, 0, 1))}
        y={y_scale(250)}
        width={1}
        opacity="0.2"
        height={height - margin.bottom - y_scale(250)}
        fill="orange"
      />
      <text
        x={x_scale(new Date(1708, 0, 1))}
        y={y_scale(250) - 10}
        opacity="0.5"
        transform={`rotate(-25 ${x_scale(new Date(1708, 0, 1)) + 5} ${y_scale(250)})`}
        fill="white"
        font-family="Montserrat, sans-serif"
        font-weight="300"
        font-size="14">Art School (1708)</text
      >

      <!-- medical school establishment -->
      <rect
        x={x_scale(new Date(1726, 0, 1))}
        y={y_scale(350)}
        width={1}
        opacity="0.2"
        height={height - margin.bottom - y_scale(350)}
        fill="orange"
      />
      <text
        x={x_scale(new Date(1726, 0, 1))}
        y={y_scale(350) - 10}
        transform={`rotate(-25 ${x_scale(new Date(1726, 0, 1)) + 5} ${y_scale(350)})`}
        fill="white"
        opacity="0.5"
        font-family="Montserrat, sans-serif"
        font-weight="300"
        font-size="14">Medical School (1726)</text
      >

      <!-- veterinary school establishment -->
      <rect
        x={x_scale(new Date(1823, 0, 1))}
        y={y_scale(500)}
        width={1}
        opacity="0.2"
        height={height - margin.bottom - y_scale(500)}
        fill="orange"
      />
      <text
        x={x_scale(new Date(1823, 0, 1))}
        y={y_scale(500)}
        transform={`rotate(-25 ${x_scale(new Date(1823, 0, 1)) + 5} ${y_scale(500)})`}
        fill="white"
        opacity="0.5"
        font-family="Montserrat, sans-serif"
        font-weight="300"
        font-size="14">Veterinary School (1823)</text
      >

      <!-- divinity school establishment -->
      <rect
        x={x_scale(new Date(1843, 0, 1))}
        opacity="0.2"
        y={y_scale(600)}
        width={1}
        height={height - margin.bottom - y_scale(600)}
        fill="orange"
      />
      <text
        x={x_scale(new Date(1843, 0, 1))}
        y={y_scale(600)}
        opacity="0.5"
        transform={`rotate(-25 ${x_scale(new Date(1843, 0, 1)) + 5} ${y_scale(600)})`}
        fill="white"
        font-family="Montserrat, sans-serif"
        font-weight="300"
        font-size="14">Divinity School (1843)</text
      >

      <!-- infirmary/efi -->
      <rect
        x={x_scale(new Date(1880, 0, 1))}
        opacity="0.2"
        y={y_scale(600)}
        width={1}
        height={height - margin.bottom - y_scale(600)}
        fill="orange"
      />
      <text
        x={x_scale(new Date(1880, 0, 1)) + 5}
        y={y_scale(600)}
        transform={`rotate(-25 ${x_scale(new Date(1880, 0, 1)) + 5} ${y_scale(600)})`}
        opacity="0.5"
        fill="white"
        font-weight="300"
        font-size="14">Infirmary built (EFI) (1880)</text
      >
    {/if}
  </svg>
{/if}

<style>
  svg {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    pointer-events: none;
  }
</style>