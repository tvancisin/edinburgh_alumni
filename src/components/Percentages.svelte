<script>
  export let percentage_datasets;
  export let activeKey;
  export let current_ungrouped;

  const ROW_BATCH_SIZE = 20;
  const LOAD_MORE_THRESHOLD_PX = 120;

  let visibleCount = ROW_BATCH_SIZE;
  let lastDatasetSignature = "";

  const uniqueInformationTypes = [
    "name",
    "birthplace",
    "nationality",
    "previous_education",
    "previous_uni",
    "entry_year",
    "age",
    "address",
    "degree",
    "thesis",
    "scan",
    "career",
    "death",
  ];

  const infoKeyMap = {
    name: "name",
    birthplace: "birthplace",
    nationality: "nationality",
    previous_education: "previous_education",
    previous_uni: "previous_uni",
    entry_year: "entry_year",
    age: "age",
    address: "address",
    degree: "degree",
    thesis: "thesis",
    scan: "scan",
    career: "career",
    death: "death",
  };

  function hasAttributeOnFirstEntry(data, attribute) {
    if (!Array.isArray(data) || data.length === 0) return false;
    const firstEntry = data[0];
    return (
      firstEntry != null &&
      Object.prototype.hasOwnProperty.call(firstEntry, attribute)
    );
  }

  function isPresent(value) {
    if (value == null) return false;

    if (typeof value === "string") {
      const normalized = value.trim();
      return normalized !== "" && normalized !== "NA" && normalized !== "N/A";
    }

    if (typeof value === "number") {
      return Number.isFinite(value);
    }

    if (Array.isArray(value)) {
      return value.some((item) => isPresent(item));
    }

    if (typeof value === "object") {
      if ("$numberDouble" in value) {
        const asNumber = Number(value.$numberDouble);
        return Number.isFinite(asNumber);
      }

      return Object.values(value).some((nestedValue) => isPresent(nestedValue));
    }

    return true;
  }

  function getInfoValue(row, key) {
    switch (key) {
      case "name":
        if (row?.name && typeof row.name === "object") {
          return row.name.original ?? row.name.normalized;
        }
        return row?.name;
      case "birthplace":
        return row?.birthplace ?? row?.source_data?.birthplace;
      case "nationality":
        return row?.nationality ?? row?.source_data?.nationality;
      case "entry_year":
        return row?.entry_year ?? row?.source_data?.entry_year;
      case "age":
        return row?.age ?? row?.source_data?.age;
      case "address":
        return row?.address ?? row?.source_data?.address?.original_name;
      case "thesis":
        return row?.thesis ?? row?.source_data?.thesis;
      default:
        return row?.[key] ?? row?.source_data?.[key];
    }
  }

  function getNameValue(row) {
    if (row?.name && typeof row.name === "object") {
      return row.name.original ?? row.name.normalized ?? null;
    }

    return row?.name ?? null;
  }

  function collectLeafValues(value, prefix = "", out = {}) {
    if (value == null || typeof value !== "object") {
      if (prefix) out[prefix] = value;
      return out;
    }

    if (Array.isArray(value)) {
      if (prefix) out[prefix] = value;
      return out;
    }

    if ("$numberDouble" in value) {
      if (prefix) out[prefix] = value;
      return out;
    }

    for (const [key, nested] of Object.entries(value)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      collectLeafValues(nested, nextPrefix, out);
    }

    return out;
  }

  function buildDisplayRow(row) {
    const result = {};

    result.name = getNameValue(row);

    if (row?.name && typeof row.name === "object") {
      for (const [key, value] of Object.entries(row.name)) {
        if (key === "normalized") continue;
        result[key] = value;
      }
    }

    for (const [key, value] of Object.entries(row ?? {})) {
      if (key === "name" || key === "source_data") continue;

      if (value == null || typeof value !== "object" || Array.isArray(value)) {
        result[key] = value;
      } else {
        Object.assign(result, collectLeafValues(value, key));
      }
    }

    if (row?.source_data && typeof row.source_data === "object") {
      const sourceFields = collectLeafValues(row.source_data);

      for (const [key, value] of Object.entries(sourceFields)) {
        if (!(key in result)) {
          result[key] = value;
        }
      }
    }

    return result;
  }

  function formatFieldLabel(key) {
    return key.replaceAll("_", " ").replaceAll(".", " ");
  }

  function formatDisplayValue(value) {
    if (!isPresent(value)) return "-";

    if (Array.isArray(value)) {
      const presentItems = value.filter((item) => isPresent(item));
      return presentItems.length ? presentItems.join(", ") : "-";
    }

    if (typeof value === "object") {
      if ("$numberDouble" in value) {
        const asNumber = Number(value.$numberDouble);
        return Number.isFinite(asNumber) ? String(asNumber) : "-";
      }

      return JSON.stringify(value);
    }

    return String(value);
  }

  function sortFields(a, b) {
    const preferredOrder = [
      "name",
      "forename",
      "middlename",
      "surname",
      "entry_year",
      "birthplace",
      "nationality",
      "age",
      "address",
      "degree",
      "thesis",
      "career",
      "source",
      "collection",
    ];

    const indexA = preferredOrder.indexOf(a);
    const indexB = preferredOrder.indexOf(b);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return a.localeCompare(b);
  }

  function loadMoreRows() {
    const totalRows = current_ungrouped?.length ?? 0;

    if (visibleCount >= totalRows) return;
    visibleCount = Math.min(visibleCount + ROW_BATCH_SIZE, totalRows);
  }

  function handleNamesScroll(event) {
    const target = event.currentTarget;
    const distanceFromBottom =
      target.scrollHeight - (target.scrollTop + target.clientHeight);

    if (distanceFromBottom <= LOAD_MORE_THRESHOLD_PX) {
      loadMoreRows();
    }
  }

  // uncertainty calculation
  function calculatePercentage(data) {
    const total = data.length;
    const counts = Object.fromEntries(
      uniqueInformationTypes.map((key) => [key, { present: 0 }]),
    );

    data.forEach((row) => {
      uniqueInformationTypes.forEach((key) => {
        const value = getInfoValue(row, key);

        if (isPresent(value)) {
          counts[key].present += 1;
        }
      });
    });

    return Object.fromEntries(
      Object.entries(counts).map(([key, { present }]) => [
        key,
        { count: present, total },
      ]),
    );
  }

  function calculateInformationDensity(data) {
    const total = data.length;
    const buckets = [
      { key: "low", label: "0-33% filled", color: "#4d4d4d", count: 0 },
      { key: "medium", label: "33-66% filled", color: "#a3a3a3", count: 0 },
      { key: "high", label: "66-100% filled", color: "#ffffff", count: 0 },
    ];

    data.forEach((row) => {
      const filledCount = uniqueInformationTypes.reduce((acc, key) => {
        const value = getInfoValue(row, key);
        return acc + (isPresent(value) ? 1 : 0);
      }, 0);

      const ratio = uniqueInformationTypes.length
        ? filledCount / uniqueInformationTypes.length
        : 0;

      let bucketIndex = 0;
      if (ratio > 2 / 3) bucketIndex = 2;
      else if (ratio > 1 / 3) bucketIndex = 1;

      buckets[bucketIndex].count += 1;
    });

    return {
      total,
      buckets: buckets.map((bucket) => ({
        ...bucket,
        widthPct: total ? (bucket.count / total) * 100 : 0,
      })),
    };
  }

  $: percentages =
    percentage_datasets[activeKey] && percentage_datasets[activeKey].length
      ? calculatePercentage(percentage_datasets[activeKey])
      : Object.fromEntries(uniqueInformationTypes.map((d) => [d, { count: 0, total: 0 }]));

  $: enrichmentCounts = (() => {
    const data = percentage_datasets?.[activeKey] ?? [];
    const total = data.length;
    const wikidata = data.filter((r) => isPresent(r?.wikidata)).length;
    const phd_thesis = data.filter((r) => isPresent(r?.phd_thesis)).length;
    const st_andrews = data.filter(
      (r) =>
        isPresent(r?.st_andrews) ||
        isPresent(r?.st_andrews_data) ||
        activeKey === "st_andrews",
    ).length;
    return { wikidata, phd_thesis, st_andrews, total };
  })();
  $: infoDensity = calculateInformationDensity(percentage_datasets?.[activeKey] ?? []);
  $: {
    const signature = `${activeKey}:${current_ungrouped?.length ?? 0}`;
    if (signature !== lastDatasetSignature) {
      lastDatasetSignature = signature;
      visibleCount = Math.min(ROW_BATCH_SIZE, current_ungrouped?.length ?? 0);
    }
  }
  $: displayRows = (current_ungrouped ?? [])
    .slice(0, visibleCount)
    .map((row) => buildDisplayRow(row));
  $: allDisplayFields = Array.from(
    new Set(displayRows.flatMap((row) => Object.keys(row))),
  ).sort(sortFields);
</script>

<div class="info-list">
  <em style="color: #7CACF8;">Type and Amount of Data: </em>
  {#each uniqueInformationTypes as item}
    <div class="info-row">
      <span class="label">{item}</span>

      <div class="bar">
        <div
          class="bar-fill"
          style="width: {percentages[infoKeyMap[item]]?.total ? (percentages[infoKeyMap[item]].count / percentages[infoKeyMap[item]].total * 100) : 0}%"
        ></div>
      </div>

      <span class="pct">
        {percentages[infoKeyMap[item]]?.count ?? 0}/{percentages[infoKeyMap[item]]?.total ?? 0}
      </span>
    </div>
  {/each}
  <br />
  <em style="color: #7CACF8;">Data Enrichment:</em>
  <div class="enrichment-list">
    <div class="info-row">
      <span class="label">Wikidata</span>
      <div class="bar">
        <div class="bar-fill" style="width: {enrichmentCounts.total ? (enrichmentCounts.wikidata / enrichmentCounts.total * 100) : 0}%"></div>
      </div>
      <span class="pct">{enrichmentCounts.wikidata}/{enrichmentCounts.total}</span>
    </div>
    <div class="info-row">
      <span class="label">PhD Theses</span>
      <div class="bar">
        <div class="bar-fill" style="width: {enrichmentCounts.total ? (enrichmentCounts.phd_thesis / enrichmentCounts.total * 100) : 0}%"></div>
      </div>
      <span class="pct">{enrichmentCounts.phd_thesis}/{enrichmentCounts.total}</span>
    </div>
    <div class="info-row">
      <span class="label">St Andrews</span>
      <div class="bar">
        <div class="bar-fill" style="width: {enrichmentCounts.total ? (enrichmentCounts.st_andrews / enrichmentCounts.total * 100) : 0}%"></div>
      </div>
      <span class="pct">{enrichmentCounts.st_andrews}/{enrichmentCounts.total}</span>
    </div>
  </div>
  <br />
  <em style="color: #7CACF8;">Overall Information Density:</em>
  <div class="density-list">
    <div class="info-row density-row">
      <span class="label">Record fullness</span>
      <div class="bar stacked-bar">
        {#each infoDensity.buckets as bucket}
          <div
            class="density-segment"
            style="width: {bucket.widthPct}%; background-color: {bucket.color};"
            title={`${bucket.label}: ${bucket.count}/${infoDensity.total}`}
          ></div>
        {/each}
      </div>
      <!-- <span class="pct">{infoDensity.total}/{infoDensity.total}</span> -->
    </div>
    <div class="density-legend">
      {#each infoDensity.buckets as bucket}
        <p class="density-legend-item">
          <span
            class="density-legend-swatch"
            style="background-color: {bucket.color};"
          ></span>
          <span>{bucket.label}</span>
          <span>{bucket.count}/{infoDensity.total}</span>
        </p>
      {/each}
    </div>
  </div>
  <br />
  <em style="color: #7CACF8;">{" Students:" + "  (" + current_ungrouped.length + ")"} </em>
  <div class="names" on:scroll={handleNamesScroll}>
    {#each displayRows as row}
      <div class="student-row">
        {#each allDisplayFields as field}
          <p class="field-row">
            <span class="field-label">{formatFieldLabel(field)}:</span>
            <span class="field-value">{formatDisplayValue(row[field])}</span>
          </p>
        {/each}
      </div>
    {/each}
    {#if visibleCount < current_ungrouped.length}
      <p class="list-status">Showing {visibleCount} of {current_ungrouped.length} students...</p>
    {/if}
  </div>
</div>

<style>
  .info-list {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 0px;
    font-size: 0.9rem;
    z-index: 2;
  }

  .info-row {
    font-size: 12px;
    width: 100%;
    display: grid;
    grid-template-columns: 120px 1fr 80px;
    align-items: center;
    gap: 10px;
  }

  .bar {
    height: 8px;
    background: rgba(61, 61, 61, 0.5);
  }

  .bar-fill {
    height: 100%;
    background: #bfbfbf;
  }

  .pct {
    display: block;
    text-align: right;
  }

  .enrichment-list {
    margin-top: 4px;
  }

  .density-list {
    margin-top: 4px;
  }

  .density-row {
    margin-bottom: 4px;
  }

  .stacked-bar {
    display: flex;
    overflow: hidden;
  }

  .density-segment {
    height: 100%;
    background: #ffffff;
  }

  .density-legend {
    display: grid;
    gap: 2px;
  }

  .density-legend-item {
    margin: 0;
    font-size: 11px;
    color: #bfbfbf;
    display: grid;
    grid-template-columns: 12px 1fr auto;
    align-items: center;
    gap: 6px;
  }

  .density-legend-swatch {
    width: 10px;
    height: 10px;
    background: #ffffff;
    display: inline-block;
  }

  .names {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .student-row {
    margin: 0 0 8px;
    padding: 4px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .field-row {
    margin: 2px 0;
    font-size: 12px;
    line-height: 1.25;
    display: flex;
    gap: 6px;
  }

  .field-label {
    color: #bfbfbf;
    min-width: 120px;
  }

  .field-value {
    color: #ffffff;
    word-break: break-word;
  }

  .list-status {
    margin: 8px 0;
    font-size: 11px;
    color: #bfbfbf;
  }
</style>
