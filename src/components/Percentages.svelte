<script>
  export let percentage_datasets;
  export let activeKey;

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

    // convert to percentages
    return Object.fromEntries(
      Object.entries(counts).map(([key, { present }]) => [
        key,
        Math.round((present / total) * 100),
      ]),
    );
  }

  $: percentages =
    percentage_datasets[activeKey] && percentage_datasets[activeKey].length
      ? calculatePercentage(percentage_datasets[activeKey])
      : Object.fromEntries(uniqueInformationTypes.map((d) => [d, 0]));

  $: activeDataset = percentage_datasets?.[activeKey] ?? [];
  $: hasWikidata = hasAttributeOnFirstEntry(activeDataset, "wikidata");
  $: hasPhdThesis = hasAttributeOnFirstEntry(activeDataset, "phd_thesis");
  $: hasStAndrews =
    activeKey === "st_andrews" ||
    hasAttributeOnFirstEntry(activeDataset, "st_andrews") ||
    hasAttributeOnFirstEntry(activeDataset, "st_andrews_data");
</script>

<div class="info-list">
  <em style="color: #7CACF8;">Source Data:</em>
  {#each uniqueInformationTypes as item}
    <div class="info-row">
      <span class="label">{item}</span>

      <div class="bar">
        <div
          class="bar-fill"
          style="width: {percentages[infoKeyMap[item]] || 0}%"
        ></div>
      </div>

      <span class="pct">
        {percentages[infoKeyMap[item]] || 0}%
      </span>
    </div>
  {/each}
  <br />
  <em style="color: #7CACF8;">Data Enrichment:</em>
  <div class="enrichment-list">
    <p class="enrichment-row">
      <span>Wikidata:</span>
      <span class="tick" style:visibility={hasWikidata ? "visible" : "hidden"}
        >✓</span
      >
    </p>
    <p class="enrichment-row">
      <span>PhD Theses:</span>
      <span class="tick" style:visibility={hasPhdThesis ? "visible" : "hidden"}
        >✓</span
      >
    </p>
    <p class="enrichment-row">
      <span>St Andrews:</span>
      <span class="tick" style:visibility={hasStAndrews ? "visible" : "hidden"}
        >✓</span
      >
    </p>
  </div>
</div>

<style>
  .info-list {
    position: absolute;
    top: 20px;
    left: 70px;
    width: 350px;
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
    grid-template-columns: 160px 1fr 40px;
    align-items: center;
    gap: 10px;
  }

  .bar {
    height: 8px;
    background: rgba(111, 111, 111, 0.5);
  }

  .bar-fill {
    height: 100%;
    background: #bfbfbf;
  }

  .enrichment-list {
    margin-top: 4px;
  }

  .enrichment-row {
    font-size: 12px;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 16px;
    line-height: 16px;
  }

  .tick {
    width: 12px;
    height: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    line-height: 1;
  }
</style>
