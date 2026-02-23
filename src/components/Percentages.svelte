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

  // uncertainty calculation
  function calculateAttributeCoverage(data) {
    const total = data.length;
    const counts = {};

    data.forEach((row) => {
      Object.entries(row).forEach(([key, value]) => {
        if (!counts[key]) {
          counts[key] = { present: 0 };
        }

        if (value !== "NA" && value !== "") {
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
      ? calculateAttributeCoverage(percentage_datasets[activeKey])
      : Object.fromEntries(uniqueInformationTypes.map((d) => [d, 0]));
</script>

<div class="info-list">
  <em>Type and percentage of information available</em>
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
</div>

<style>
  .info-list {
    position: absolute;
    top: 80px;
    left: 70px;
    width: 360px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.9rem;
    z-index: 2;
  }

  .info-row {
    width: 100%;
    display: grid;
    grid-template-columns: 160px 1fr 40px;
    align-items: center;
    gap: 10px;
  }

  .bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.2);
  }

  .bar-fill {
    height: 100%;
    background: #bfbfbf;
  }
</style>
