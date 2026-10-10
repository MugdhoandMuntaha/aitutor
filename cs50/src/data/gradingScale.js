/**
 * Grading System Specification for B.Sc. in Computer Science & Engineering (B.Sc. CSE)
 * Harvard University FAS / SEAS 4.0 Standard Scale
 */

export const DEFAULT_GRADING_SCALE = [
  { letter: "A+", minMarks: 97, maxMarks: 100, point: 4.00, quality: "Outstanding", color: "#A51C30" },
  { letter: "A",  minMarks: 93, maxMarks: 96.99, point: 4.00, quality: "Excellent",   color: "#A51C30" },
  { letter: "A-", minMarks: 90, maxMarks: 92.99, point: 3.70, quality: "Very Good",   color: "#C92A3E" },
  { letter: "B+", minMarks: 87, maxMarks: 89.99, point: 3.30, quality: "Good",        color: "#2563EB" },
  { letter: "B",  minMarks: 83, maxMarks: 86.99, point: 3.00, quality: "Above Average", color: "#3B82F6" },
  { letter: "B-", minMarks: 80, maxMarks: 82.99, point: 2.70, quality: "Satisfactory", color: "#4F46E5" },
  { letter: "C+", minMarks: 77, maxMarks: 79.99, point: 2.30, quality: "Marginal",    color: "#D97706" },
  { letter: "C",  minMarks: 73, maxMarks: 76.99, point: 2.00, quality: "Average",     color: "#EAB308" },
  { letter: "C-", minMarks: 70, maxMarks: 72.99, point: 1.70, quality: "Below Average", color: "#EA580C" },
  { letter: "D+", minMarks: 67, maxMarks: 69.99, point: 1.30, quality: "Poor",        color: "#DC2626" },
  { letter: "D",  minMarks: 60, maxMarks: 66.99, point: 1.00, quality: "Passing",     color: "#B91C1C" },
  { letter: "F",  minMarks: 0,  maxMarks: 59.99, point: 0.00, quality: "Failing",     color: "#7F1D1D" }
];

export const DEGREE_CLASSIFICATIONS = [
  { minCgpa: 3.85, title: "Summa Cum Laude (Highest Distinction)", badgeClass: "badge-summa" },
  { minCgpa: 3.70, title: "Magna Cum Laude (High Distinction)", badgeClass: "badge-magna" },
  { minCgpa: 3.50, title: "Cum Laude (Distinction)", badgeClass: "badge-cumlaude" },
  { minCgpa: 3.00, title: "Dean's Honor List (Good Standing)", badgeClass: "badge-honors" },
  { minCgpa: 2.00, title: "Regular Good Standing", badgeClass: "badge-regular" },
  { minCgpa: 0.00, title: "Academic Probation Warning", badgeClass: "badge-warning" }
];

export function getGradeFromMarks(marks, customScale = DEFAULT_GRADING_SCALE) {
  const numericMarks = Math.min(100, Math.max(0, parseFloat(marks) || 0));
  for (const grade of customScale) {
    if (numericMarks >= grade.minMarks) {
      return {
        letter: grade.letter,
        point: grade.point,
        quality: grade.quality,
        color: grade.color,
        marks: numericMarks,
        passed: grade.point > 0
      };
    }
  }
  const fGrade = customScale[customScale.length - 1];
  return {
    letter: fGrade.letter,
    point: fGrade.point,
    quality: fGrade.quality,
    color: fGrade.color,
    marks: numericMarks,
    passed: false
  };
}

export function getDegreeClassification(cgpa) {
  const val = parseFloat(cgpa) || 0;
  for (const cls of DEGREE_CLASSIFICATIONS) {
    if (val >= cls.minCgpa) {
      return cls;
    }
  }
  return DEGREE_CLASSIFICATIONS[DEGREE_CLASSIFICATIONS.length - 1];
}
