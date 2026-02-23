import * as d3 from "d3";
import { writable } from "svelte/store";
import { getCSV, getJSON, medical_terms, fillMissingYears } from "./utils.js";

const careerFields = [
  "Apprentice.of.Royal.College.of.Surgeons",
  "British.Navy",
  "Fellow.of.Royal.College.of.Surgeons",
  "Indian.Medical.Service",
  "Royal.Army.Medical.Corps",
  "Royal.Medical.Society",
];

const hasValue = (v) => v !== "NA" && v !== "" && v != null;

function addCareerField(entry) {
  return {
    ...entry,
    career: careerFields.some((field) => hasValue(entry[field])) ? "1" : "NA",
  };
}

export const datasetsStore = writable(null);
export const dataStatus = writable({ loading: false, error: null });

export async function loadData() {
  dataStatus.set({ loading: true, error: null });

  try {
    let medics,
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
      all_medics_grouped;

    [
      medics,
      new_college,
      veterinary,
      veterinary_graduates,
      matriculations,
      extra_academic,
      women_med_graduates,
      edinburgh_seven,
    ] = await getCSV([
      "./1762_1826_medical.csv",
      "./new_college_students.csv",
      "./early_veterinary.csv",
      "./veterinary_graduates.csv",
      "./matriculations.csv",
      "./extra_academic.csv",
      "./female_graduates.csv",
      "./edinburgh_seven.csv",
    ]);

    [st_andrews, medics_sample] = await getJSON([
      "./st_andrews.json",
      "./alumni.json",
    ]);

    const st_andrews_students = st_andrews
      .map((d) => {
        const uni = d.other_universities?.find(
          (u) => u.location?.official_name === "Edinburgh" && u.from != null,
        );

        if (!uni) return null;

        return {
          ...d,
          entry_year: +uni.from,
        };
      })
      .filter(Boolean);

    year_st_andrews_group = d3
      .groups(st_andrews_students, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);

    year_st_andrews_group = fillMissingYears(year_st_andrews_group, 1500, 2025);

    medics = medics
      .filter((d) => +d.entry_year >= 1762)
      .map((d) => ({
        ...d,
        entry_year: +d.entry_year,
      }));

    medics = medics.map(addCareerField);

    year_medics_group = d3
      .groups(medics, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);
    year_medics_group = fillMissingYears(year_medics_group, 1762, 2025);

    medics_sample = medics_sample.map((d) => ({
      ...d,
      entry_year: +d.source_data.entry_year,
    }));
    medics_sample = medics_sample.filter((d) => !Number.isNaN(d.entry_year));
    year_medics_sample_group = d3
      .groups(medics_sample, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);
    year_medics_sample_group = fillMissingYears(year_medics_sample_group, 1762, 2025);

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
    year_matriculations_group = fillMissingYears(year_matriculations_group, 1700, 2025);

    extra_academic = extra_academic.filter((d) =>
      medical_terms.some((term) => d.Class.toLowerCase().includes(term.toLowerCase())),
    );
    extra_academic = extra_academic.map((d) => ({
      ...d,
      entry_year: +d.entry_year.slice(0, -5),
      no_space_name: d.name.replace(/\s+/g, ""),
    }));
    let final_extra_academics = d3.groups(extra_academic, (d) => d.no_space_name);
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
    year_extra_academic_group = fillMissingYears(year_extra_academic_group, 1762, 2025);

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

    edinburgh_seven = edinburgh_seven.map((d) => ({
      ...d,
      entry_year: +d.entry_year,
    }));
    year_edinburgh_seven_group = d3
      .groups(edinburgh_seven, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);
    year_edinburgh_seven_group = fillMissingYears(year_edinburgh_seven_group, 1762, 2025);

    all_medics = [
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

    new_college = new_college.map((d) => ({
      ...d,
      entry_year: +d.entry_year,
    }));
    year_college_group = d3
      .groups(new_college, (d) => d.entry_year)
      .filter((d) => d[0] != null && !Number.isNaN(d[0]))
      .sort((a, b) => a[0] - b[0]);
    year_college_group = fillMissingYears(year_college_group, 1762, 2025);

    veterinary = veterinary.map((d) => ({
      ...d,
      entry_year: +d.entry_year,
    }));
    year_veterinary_group = d3
      .groups(veterinary, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);
    year_veterinary_group = fillMissingYears(year_veterinary_group, 1762, 2025);

    veterinary_graduates = veterinary_graduates
      .filter((d) => +d.entry_year >= 1762)
      .map((d) => ({
        ...d,
        entry_year: +d.entry_year,
      }));
    year_veterinary_graduates_group = d3
      .groups(veterinary_graduates, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);

    const all = [
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
    all_grouped = fillMissingYears(all_grouped, 1583, 2025);

    full_years = all_grouped.map((d) => ({
      year: d[0],
      certainty: "uncertain",
      count: 200 + (Math.random() + Math.random()) * 100,
    }));

    datasetsStore.set({
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
    });

    dataStatus.set({ loading: false, error: null });
  } catch (error) {
    dataStatus.set({ loading: false, error });
    throw error;
  }
}