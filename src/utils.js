import * as d3 from "d3";

async function getIndividualCSV(path) {
  let loadedData = await d3.csv(path);
  return loadedData;
}

export async function getCSV(paths) {
  const promises = paths.map((path) => getIndividualCSV(path));
  const results = await Promise.all(promises);
  return results;
}

async function getIndividualJSON(path) {
  let loadedData = await d3.json(path);
  return loadedData;
}

export async function getGeo(paths) {
  const promises = paths.map((path) => getIndividualJSON(path));
  const results = await Promise.all(promises);
  return results;
}

export let medical_terms = [
  "Mental Diseases",
  "Medical Entomology",
  "Tropical Diseases",
  "Diseases of the Eye",
  "Skin Diseases",
  "Diseases of the Tropics",
  "Diseases of Children",
  "Diseases of the Skin",
  "Diseases of Tropical Climates",
  "Diseases of sick children",
  "Ear, Nose & Throat",
  "Larynx, Ear & Nose",
  "Ophthalmology",
  "Neurology",
  "Psychiatry",
  "Insanity",
  "Lunacy",
  "Pathological Bacteriology",
  "Clinical Bacteriology",
  "Practical Bacteriology",
  "Bacteriology",
  "Senior Bacteriology",
  "Advanced Bacteriology",
  "Public Health Laboratory",
  "Public Health (special work)",
  "Tuberculosis",
  "Surgical Anatomy",
  "Surgical Cliniques, Sick Childrens Hospital",
  "Operating Surgery",
  "Clinical Surgery",
  "Physical methods in Treatment",
  "Experimental Pharmacology",
  "Applied Anatomy",
  "Anatomy Revision class",
  "Practical Anatomy",
  "Physiology",
  "Advd. Expt. Chemical Physiology",
  "Advanced Practical Psychology",
  "Experimental Psychology",
  "Psychology (Psychiatry)",
  "Sanitary Science",
  "Public Health",
  "Tropical Medicine",
  "Protozoology",
  "Mycology",
  "Public Health Lab.",
];

export function generateSketchyRect({
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

export function groupByYear(data, yearAccessor, {
  startYear,
  endYear = 2025,
  filter = () => true
} = {}) {
  const grouped = d3
    .groups(data.filter(filter), yearAccessor)
    .sort((a, b) => a[0] - b[0]);

  return startYear != null
    ? fillMissingYears(grouped, startYear, endYear)
    : grouped;
}

export function fillMissingYears(data, startYear = null, endYear = 2025) {
  // build lookup
  const map = new Map(data.map(([year, entries]) => [year, entries]));

  // infer start year if not provided
  const years = data.map(d => d[0]);
  const minYear = startYear ?? Math.min(...years);

  const result = [];
  for (let year = minYear; year <= endYear; year++) {
    result.push([year, map.get(year) ?? []]);
  }

  return result;
}
