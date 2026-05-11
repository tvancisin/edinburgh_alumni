<script>
  import * as d3 from "d3";
  import Bars from "./Bars.svelte";

  export let data_to_draw;
  export let year_medics_group;
  export let height;
  export let width;
  export let margin;
  export let full_years;
  export let mapVisible;
  export let activeKey;
  export let all_medics_separated;
  export let x_axis;
  export let y_axis;

  let x_scale, y_scale;
  const STACK_GAP = 3;
  const Y_AXIS_MAX = 900;
  const CONNECTOR_BOTTOM_GAP = 30;
  const SOURCE_PANEL_RATIO = 0.2;
  const SOURCE_PANEL_PADDING = 10;
  const SOURCE_TITLE_Y = 26;
  const SOURCE_TITLE_SIZE = 16;
  const SOURCE_LIST_TOP = 40;
  const SOURCE_ITEM_HEIGHT = 20;
  const SOURCE_ITEM_GAP = 3;
  const SOURCE_CORNER_RADIUS = 4;
  const SOURCE_RANGE_HEIGHT = 2;
  const CONNECTOR_STAGGER = 4;
  const CONNECTOR_TOP_STAGGER_X = 2;
  const CONNECTOR_BOTTOM_BASE_OFFSET = 24;
  const CONNECTOR_RADIUS = 5;
  const CONNECTOR_START_LEAD = 2;
  const PLOT_START_GAP = 8;
  const SUBSET_COLORS = [
    "#4dd2ff",
    "#ffd166",
    "#80ed99",
    "#ff6bcb",
    "#c77dff",
    "#ff9f1c",
    "#2ec4b6",
    "#ff595e",
  ];
  let stacked_all_medics = [];
  let source_panel_width = 0;
  let source_item_width = 0;
  let plot_left = 0;
  let axis_y = 0;
  let source_items = [];
  let source_connectors = [];
  let hoveredSourceSubsetIndex = null;

  function buildConnectorPath({ startX, startY, downX, endX, endY }) {
    const turnTopX = downX - CONNECTOR_RADIUS;
    const turnTopY = startY + CONNECTOR_RADIUS;
    const turnBottomY = endY - CONNECTOR_RADIUS;

    return `M ${startX} ${startY}
      H ${turnTopX}
      Q ${downX} ${startY}, ${downX} ${turnTopY}
      V ${turnBottomY}
      Q ${downX} ${endY}, ${downX + CONNECTOR_RADIUS} ${endY}
      H ${endX}`;
  }

  function getLastNonZeroYear(subset) {
    for (let index = subset.length - 1; index >= 0; index -= 1) {
      const [year, entries] = subset[index];
      if (entries.length > 0) return year;
    }

    return null;
  }

  function getFirstNonZeroYear(subset) {
    for (let index = 0; index < subset.length; index += 1) {
      const [year, entries] = subset[index];
      if (entries.length > 0) return year;
    }

    return null;
  }

  $: should_stack_all_medics =
    activeKey === "all_medics" &&
    Array.isArray(all_medics_separated) &&
    all_medics_separated.length > 0;

  $: {
    stacked_all_medics = [];

    if (should_stack_all_medics) {
      const yearHeights = new Map();

      all_medics_separated.forEach((subset, subsetIndex) => {
        subset.forEach(([year, entries]) => {
          const segmentValue = entries.length;
          if (!segmentValue) return;

          const baseValue = yearHeights.get(year) ?? 0;
          const topValue = baseValue + segmentValue;

          stacked_all_medics.push({
            year,
            subsetIndex,
            value: segmentValue,
            baseValue,
          });

          yearHeights.set(year, topValue + STACK_GAP);
        });
      });
    }
  }

  // Compute scales based on data and dimensions
  $: if (width && height) {
    source_panel_width = width * SOURCE_PANEL_RATIO;
    source_item_width = Math.max(
      0,
      source_panel_width - SOURCE_PANEL_PADDING * 2,
    );
    plot_left = source_panel_width + margin.left + PLOT_START_GAP;
    axis_y = height - margin.bottom - CONNECTOR_BOTTOM_GAP;

    x_scale = d3
      .scaleTime()
      .domain([new Date(1582, 0, 1), new Date(2025, 0, 1)])
      .range([plot_left, width - margin.right]);

    y_scale = d3
      .scaleLinear()
      .domain([0, Y_AXIS_MAX])
      .range([axis_y, margin.top])
      .nice();
  }

  $: {
    source_items = [];
    source_connectors = [];

    if (Array.isArray(all_medics_separated)) {
      source_items = all_medics_separated
        .map((subset, subsetIndex) => ({
          subsetIndex,
          startYear: getFirstNonZeroYear(subset),
          endYear: getLastNonZeroYear(subset),
        }))
        .sort((a, b) => {
          if (a.endYear == null && b.endYear == null)
            return a.subsetIndex - b.subsetIndex;
          if (a.endYear == null) return 1;
          if (b.endYear == null) return -1;
          if (a.endYear !== b.endYear) return a.endYear - b.endYear;
          return a.subsetIndex - b.subsetIndex;
        });

      if (x_scale && axis_y) {
        source_items.forEach((item, displayIndex) => {
          if (item.startYear == null || item.endYear == null) return;

          const endX = x_scale(new Date(item.endYear, 0, 1));
          const rangeStartX = x_scale(new Date(item.startYear, 0, 1));
          const startX = source_panel_width - SOURCE_PANEL_PADDING;
          const downX = Math.min(
            startX +
              CONNECTOR_RADIUS +
              CONNECTOR_START_LEAD +
              displayIndex * CONNECTOR_TOP_STAGGER_X,
            plot_left - 8,
          );
          const startY =
            SOURCE_LIST_TOP +
            displayIndex * (SOURCE_ITEM_HEIGHT + SOURCE_ITEM_GAP) +
            SOURCE_ITEM_HEIGHT / 2;
          const endY =
            axis_y +
            CONNECTOR_BOTTOM_BASE_OFFSET +
            displayIndex * CONNECTOR_STAGGER;

          source_connectors.push({
            subsetIndex: item.subsetIndex,
            displayIndex,
            rangeStartX,
            rangeWidth: Math.max(1, endX - rangeStartX),
            rangeY: endY - SOURCE_RANGE_HEIGHT / 2,
            d: buildConnectorPath({
              startX,
              startY,
              downX,
              endX,
              endY,
            }),
          });
        });
      }
    }
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
    <g transform={`translate(0,${axis_y})`} bind:this={x_axis} />
    <g transform={`translate(${plot_left}, 0)`} bind:this={y_axis} />

    {#each source_connectors as connector (connector.subsetIndex)}
      <path
        d={connector.d}
        fill="none"
        stroke="rgba(70,130,180,0.55)"
        stroke-width="1.5"
        stroke-opacity={hoveredSourceSubsetIndex == null
          ? 0.55
          : connector.subsetIndex === hoveredSourceSubsetIndex
            ? 1
            : 0.22}
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <rect
        x={connector.rangeStartX}
        y={connector.rangeY}
        width={connector.rangeWidth}
        height={SOURCE_RANGE_HEIGHT}
        fill="white"
      />
    {/each}

    <text
      x={SOURCE_PANEL_PADDING}
      y={SOURCE_TITLE_Y}
      fill="white"
      font-size={SOURCE_TITLE_SIZE}
      font-family="Montserrat, sans-serif"
      font-weight="600"
    >
      Sources
    </text>

    {#if source_items.length > 0}
      {#each source_items as item, i (item.subsetIndex)}
        <rect
          role="presentation"
          aria-hidden="true"
          x={SOURCE_PANEL_PADDING}
          y={SOURCE_LIST_TOP + i * (SOURCE_ITEM_HEIGHT + SOURCE_ITEM_GAP)}
          width={source_item_width}
          height={SOURCE_ITEM_HEIGHT}
          rx={SOURCE_CORNER_RADIUS}
          ry={SOURCE_CORNER_RADIUS}
          fill="steelblue"
          on:mouseenter={() => (hoveredSourceSubsetIndex = item.subsetIndex)}
          on:mouseleave={() => (hoveredSourceSubsetIndex = null)}
        />
      {/each}
    {/if}

    <!-- {#each full_years as d, i}
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
    {/each} -->

    {#if should_stack_all_medics}
      {#each stacked_all_medics as bar, i (`${bar.subsetIndex}-${bar.year}`)}
        <Bars
          x={x_scale(new Date(bar.year, 0, 1))}
          value={bar.value}
          baseValue={bar.baseValue}
          yScale={y_scale}
          width={2}
          {height}
          marginBottom={margin.bottom + CONNECTOR_BOTTOM_GAP}
          fill={mapVisible
            ? "black"
            : SUBSET_COLORS[bar.subsetIndex % SUBSET_COLORS.length]}
          {i}
          year={bar.year}
        />
      {/each}
    {:else}
      {#each data_to_draw as [year, entries], i (year)}
        <Bars
          x={x_scale(new Date(year, 0, 1))}
          value={entries.length}
          yScale={y_scale}
          width={2}
          {height}
          marginBottom={margin.bottom + CONNECTOR_BOTTOM_GAP}
          fill={mapVisible ? "black" : "#bfbfbf"}
          {i}
          {year}
        />
      {/each}
    {/if}

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
      <!-- uni establishment -->
      <rect
        x={x_scale(new Date(1582, 0, 1))}
        y={y_scale(height / 4)}
        width={1}
        height={height - margin.bottom - y_scale(height / 4)}
        fill="orange"
        opacity="0.2"
      />
      <text
        x={x_scale(new Date(1582, 0, 1)) + 5}
        y={y_scale(height / 4)}
        transform={`rotate(-25 ${x_scale(new Date(1582, 0, 1)) + 5} ${y_scale(height / 4)})`}
        fill="white"
        opacity="0.5"
        font-weight="300"
        font-size="12">University Established (1583)</text
      >

      <!-- law school -->
      <!-- <rect
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
        font-size="12">Law School (1707)</text
      > -->

      <!-- art school -->
      <!-- <rect
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
        font-size="12">Art School (1708)</text
      > -->

      <!-- medical school establishment -->
      <rect
        x={x_scale(new Date(1726, 0, 1))}
        y={y_scale(height / 3)}
        width={1}
        opacity="0.2"
        height={height - margin.bottom - y_scale(height / 3)}
        fill="orange"
      />
      <text
        x={x_scale(new Date(1726, 0, 1))}
        y={y_scale(height / 3)}
        transform={`rotate(-25 ${x_scale(new Date(1726, 0, 1)) + 5} ${y_scale(height / 3)})`}
        fill="white"
        opacity="0.5"
        font-family="Montserrat, sans-serif"
        font-weight="300"
        font-size="12">Medical School (1726)</text
      >

      <!-- first women educated -->
      <rect
        x={x_scale(new Date(1867, 0, 1))}
        y={y_scale(height / 2 + 20)}
        width={1}
        opacity="0.2"
        height={height - margin.bottom - y_scale(height / 2 + 20)}
        fill="orange"
      />
      <text
        x={x_scale(new Date(1867, 0, 1))}
        y={y_scale(height / 2 + 20)}
        transform={`rotate(-25 ${x_scale(new Date(1867, 0, 1)) + 5} ${y_scale(height / 2 + 20)})`}
        fill="steelblue"
        font-family="Montserrat, sans-serif"
        font-weight="300"
        font-size="12">First Women Educated (1867)</text
      >

      <!-- women officially allowed to study -->
      <rect
        x={x_scale(new Date(1892, 0, 1))}
        y={y_scale(height / 2 + 80)}
        width={1}
        opacity="0.2"
        height={height - margin.bottom - y_scale(height / 2 + 80)}
        fill="orange"
      />
      <text
        x={x_scale(new Date(1892, 0, 1))}
        y={y_scale(height / 2 + 80)}
        transform={`rotate(-25 ${x_scale(new Date(1892, 0, 1)) + 5} ${y_scale(height / 2 + 80)})`}
        fill="steelblue"
        font-family="Montserrat, sans-serif"
        font-weight="300"
        font-size="12">Women Officially Allowed to Study (1892)</text
      >

      <!-- veterinary school establishment -->
      <!-- <rect
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
        font-size="12">Veterinary School (1823)</text
      > -->

      <!-- divinity school establishment -->
      <!-- <rect
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
        font-size="12">Divinity School (1843)</text
      > -->

      <!-- infirmary/efi -->
      <rect
        x={x_scale(new Date(1880, 0, 1))}
        opacity="0.2"
        y={y_scale(height / 2)}
        width={1}
        height={height - margin.bottom - y_scale(height / 2)}
        fill="orange"
      />
      <text
        x={x_scale(new Date(1880, 0, 1)) + 5}
        y={y_scale(height / 2)}
        transform={`rotate(-25 ${x_scale(new Date(1880, 0, 1)) + 5} ${y_scale(height / 2)})`}
        opacity="0.5"
        fill="white"
        font-weight="300"
        font-size="12">Infirmary built (EFI) (1880)</text
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
    pointer-events: auto;
  }
</style>
