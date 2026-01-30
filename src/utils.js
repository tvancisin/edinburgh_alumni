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
