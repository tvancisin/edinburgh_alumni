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
    let
      // Students of medicine 1762-1826
      medics,
      year_medics_group,

      // Students of medicine sample 1833-1846
      medics_sample,
      year_medics_sample_group,

      // Female Medical Graduates 1896-1900
      women_med_graduates,
      year_women_med_graduates_group,

      // Edinburgh Seven 1869
      edinburgh_seven,
      year_edinburgh_seven_group,

      // Extra Academic Students 1887-1922
      extra_academic,
      year_extra_academic_group,

      // First Matriculations 1890-1899
      matriculations_geo,
      matriculations_medics,
      year_matriculations_group,

      // Women Doctors
      women_doctors,
      year_women_doctors_group,

      // Women physiology
      women_physiology,
      year_women_physiology_group,

      // St Andrews/Edinburgh students 1579-1897
      st_andrews,
      year_st_andrews_group,

      // Combined datasets
      all_grouped,
      full_years,
      all_medics,
      all_medics_separated,
      all_medics_grouped,
      all_women_medics,
      all_women_medics_grouped,

      // Students at New College 1843-1943
      new_college,
      year_college_group,

      // Veterinary
      veterinary,
      year_veterinary_group,
      veterinary_graduates,
      year_veterinary_graduates_group,

      // Geo layers
      colonies_1885,
      five_days,
      ten_days,
      twenty_days,

      // student_numbers
      students_1836_1920,
      women_1914_1965;


    [
      medics,
      new_college,
      veterinary,
      veterinary_graduates,
      extra_academic,
      women_med_graduates,
      edinburgh_seven,
      students_1836_1920,
      women_1914_1965,
    ] = await getCSV([
      "./1762_1826_medical.csv",
      "./new_college_students.csv",
      "./early_veterinary.csv",
      "./veterinary_graduates.csv",
      "./extra_academic.csv",
      "./female_graduates.csv",
      "./edinburgh_seven.csv",
      "./students_1836_1920.csv",
      "./women_students_1914_1965.csv"
    ]);

    [st_andrews, medics_sample, matriculations_geo, women_doctors, women_physiology,
      colonies_1885, five_days, ten_days, twenty_days] = await getJSON([
        "./st_andrews.json",
        "./medics_sample_geo.json",
        "./matriculations_geo.json",
        "./women_doctors_geo.json",
        "./women_physiology_geo.json",
        "./geojson/colonies_1885_update.geojson",
        "./geojson/five_days.geojson",
        "./geojson/ten_days.geojson",
        "./geojson/twenty_days.geojson",
      ]);

    ////////////////////////////////////////////////////////////////////////
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

    ////////////////////////////////////////////////////////////////////////
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

    ////////////////////////////////////////////////////////////////////////
    medics_sample = medics_sample.map((d) => ({
      ...d,
      entry_year: +d.source_data.entry_year,
    }));
    medics_sample = medics_sample.filter((d) => !Number.isNaN(d.entry_year));
    year_medics_sample_group = d3
      .groups(medics_sample, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);
    year_medics_sample_group = fillMissingYears(year_medics_sample_group, 1762, 2025);

    ////////////////////////////////////////////////////////////////////////
    matriculations_medics = matriculations_geo.filter((d) => d.source_data.Faculty === "Medicine");
    matriculations_medics = matriculations_medics.map((d) => ({
      ...d,
      entry_year: +d.source_data.entry_year,
    }));
    year_matriculations_group = d3
      .groups(matriculations_medics, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);

    year_matriculations_group = year_matriculations_group.filter(
      ([year]) => Number.isFinite(year) && year >= 1762 && year <= 2025,
    );
    year_matriculations_group = fillMissingYears(year_matriculations_group, 1762, 2025);

    ////////////////////////////////////////////////////////////////////////
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

    ////////////////////////////////////////////////////////////////////////
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

    ////////////////////////////////////////////////////////////////////////
    edinburgh_seven = edinburgh_seven.map((d) => ({
      ...d,
      entry_year: +d.entry_year,
    }));
    year_edinburgh_seven_group = d3
      .groups(edinburgh_seven, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);
    year_edinburgh_seven_group = fillMissingYears(year_edinburgh_seven_group, 1762, 2025);

    ////////////////////////////////////////////////////////////////////////
    women_doctors = women_doctors.map((d) => ({
      ...d,
      entry_year: +d.source_data.entry_year,
    }));
    year_women_doctors_group = d3
      .groups(women_doctors, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);
    year_women_doctors_group = fillMissingYears(year_women_doctors_group, 1762, 2025);

    ////////////////////////////////////////////////////////////////////////
    women_physiology = women_physiology.map((d) => ({
      ...d,
      entry_year: +d.source_data.entry_year,
    }));

    year_women_physiology_group = d3
      .groups(women_physiology, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);
    year_women_physiology_group = fillMissingYears(year_women_physiology_group, 1762, 2025);

    ////////////////////////////////////////////////////////////////////////
    all_medics = [
      ...medics,
      ...medics_sample,
      ...matriculations_medics,
      ...extra_academic,
      ...women_med_graduates,
      ...edinburgh_seven,
      ...women_doctors,
      ...women_physiology,
    ];

    all_medics_separated = [year_medics_group, year_medics_sample_group,  year_extra_academic_group, year_women_med_graduates_group, year_edinburgh_seven_group, year_women_doctors_group, year_women_physiology_group, year_matriculations_group];

    all_medics_grouped = d3
      .groups(all_medics, (d) => d.entry_year)
      .filter((d) => d[0] != null && !Number.isNaN(d[0]))
      .filter((d) => d[0] >= 1762)
      .sort((a, b) => a[0] - b[0]);
    all_medics_grouped = fillMissingYears(all_medics_grouped, 1762, 2025);

    ////////////////////////////////////////////////////////////////////////
    all_women_medics = [
      ...matriculations_medics.filter((d) => d.source_data.Gender === "Female"),
      ...women_med_graduates,
      ...extra_academic.filter((d) => d.Gender === "Female"),
      ...edinburgh_seven,
      ...women_doctors,
      ...women_physiology,
    ];
    all_women_medics_grouped = d3
      .groups(all_women_medics, (d) => d.entry_year)
      .filter((d) => d[0] != null && !Number.isNaN(d[0]))
      .filter((d) => d[0] >= 1762)
      .sort((a, b) => a[0] - b[0]);
    all_women_medics_grouped = fillMissingYears(all_women_medics_grouped, 1762, 2025);

    ////////////////////////////////////////////////////////////////////////
    new_college = new_college.map((d) => ({
      ...d,
      entry_year: +d.entry_year,
    }));
    year_college_group = d3
      .groups(new_college, (d) => d.entry_year)
      .filter((d) => d[0] != null && !Number.isNaN(d[0]))
      .sort((a, b) => a[0] - b[0]);
    year_college_group = fillMissingYears(year_college_group, 1762, 2025);

    ////////////////////////////////////////////////////////////////////////
    veterinary = veterinary.map((d) => ({
      ...d,
      entry_year: +d.entry_year,
    }));
    year_veterinary_group = d3
      .groups(veterinary, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);
    year_veterinary_group = fillMissingYears(year_veterinary_group, 1762, 2025);

    ////////////////////////////////////////////////////////////////////////
    veterinary_graduates = veterinary_graduates
      .filter((d) => +d.entry_year >= 1762)
      .map((d) => ({
        ...d,
        entry_year: +d.entry_year,
      }));
    year_veterinary_graduates_group = d3
      .groups(veterinary_graduates, (d) => d.entry_year)
      .sort((a, b) => a[0] - b[0]);

    ////////////////////////////////////////////////////////////////////////
    const all = [
      ...medics,
      ...new_college,
      ...veterinary,
      ...veterinary_graduates,
      ...matriculations_medics,
      ...extra_academic,
      ...women_med_graduates,
      ...edinburgh_seven,
      ...medics_sample,
      ...women_doctors,
      ...women_physiology,
    ];
    all_grouped = d3
      .groups(all, (d) => d.entry_year)
      .filter((d) => d[0] != null && !Number.isNaN(d[0]))
      .sort((a, b) => a[0] - b[0]);
    all_grouped = fillMissingYears(all_grouped, 1583, 2025);
    full_years = all_grouped.map((d) => ({
      year: d[0],
      certainty: "uncertain",
      count: 5 + (Math.random() + Math.random()) * 100,
    }));


    ////////////////////////////////////////////////////////////////////////
    let women_mat = matriculations_medics.filter((d) => d.source_data.Gender === "Female");
    console.log("matriculations: ", women_mat);

    console.log("medical graduates: ", women_med_graduates);

    let women_extra = final_extra_academics.filter((d) => d[1][0].Gender == "Female");
    console.log("extra academics: ", women_extra);

    console.log("edinburgh seven: ", edinburgh_seven);

    let st_andrews_women = st_andrews_students.filter((d) => d.gender === "F");
    console.log("st andrews women: ", st_andrews_women);

    console.log("women doctors: ", women_doctors);

    console.log("women physiology: ", women_physiology);

    ///////////////////////////////////////////////////////////////////////
    students_1836_1920 = students_1836_1920.map((d) => ({
      ...d,
      entry_year: +d.entry_year,
      number: +d.number,
    }));

    women_1914_1965 = women_1914_1965.map((d) => ({
      ...d,
      entry_year: +d.entry_year,
      number: +d.number,
    }));

    datasetsStore.set({
      // Students of medicine 1762-1826
      medics,
      year_medics_group,

      // Students of medicine sample 1833-1846
      medics_sample,
      year_medics_sample_group,

      // Female Medical Graduates 1896-1900
      women_med_graduates,
      year_women_med_graduates_group,

      // Edinburgh Seven 1869
      edinburgh_seven,
      year_edinburgh_seven_group,

      // Extra Academic Students 1887-1922
      extra_academic,
      year_extra_academic_group,

      // First Matriculations 1890-1899
      matriculations_medics,
      year_matriculations_group,

      // Women Doctors
      women_doctors,
      year_women_doctors_group,

      women_physiology,
      year_women_physiology_group,

      // St Andrews/Edinburgh students 1579-1897
      st_andrews,
      year_st_andrews_group,

      // Combined datasets
      all_grouped,
      full_years,
      all_medics,
      all_medics_grouped,
      all_medics_separated,
      all_women_medics,
      all_women_medics_grouped,

      // Students at New College 1843-1943
      new_college,
      year_college_group,

      // Veterinary
      veterinary,
      year_veterinary_group,
      veterinary_graduates,
      year_veterinary_graduates_group,

      // Geo layers
      colonies_1885,
      five_days,
      ten_days,
      twenty_days,
      // student numbers
      students_1836_1920,
      women_1914_1965,
    });

    dataStatus.set({ loading: false, error: null });
  } catch (error) {
    dataStatus.set({ loading: false, error });
    throw error;
  }
}