/**
 * Academic & GPA Calculation Engine (React ES Module)
 * Weighted Grade Point Averaging, Running CGPA, and Degree Audit
 */

import { getGradeFromMarks, getDegreeClassification } from "../data/gradingScale";
import { dataStore } from "./dataStore";

export function calculateSemester(semesterRecord, customScale = null) {
  const scale = customScale || dataStore.getGradingScale();
  const results = semesterRecord.results || [];

  let totalCredits = 0;
  let earnedCredits = 0;
  let totalGradePoints = 0;
  const evaluatedCourses = [];

  for (const item of results) {
    const courseInfo = dataStore.findCourseInCurriculum(item.courseCode);
    const credits = parseFloat(item.credits || (courseInfo ? courseInfo.credits : 4.0));
    const grade = getGradeFromMarks(item.marks, scale);
    const creditPoints = credits * grade.point;

    totalCredits += credits;
    if (grade.passed) {
      earnedCredits += credits;
    }
    totalGradePoints += creditPoints;

    evaluatedCourses.push({
      courseCode: item.courseCode,
      courseTitle: courseInfo ? courseInfo.title : "Special Topic in Computer Science",
      department: courseInfo ? courseInfo.department : "Computer Science",
      category: courseInfo ? courseInfo.category : "Elective",
      credits: credits,
      marks: parseFloat(item.marks),
      letter: grade.letter,
      point: grade.point,
      creditPoints: parseFloat(creditPoints.toFixed(2)),
      quality: grade.quality,
      color: grade.color,
      passed: grade.passed
    });
  }

  const sgpa = totalCredits > 0 ? parseFloat((totalGradePoints / totalCredits).toFixed(2)) : 0.00;

  return {
    semesterNumber: semesterRecord.semesterNumber,
    term: semesterRecord.term,
    isPublished: Boolean(semesterRecord.isPublished),
    publishDate: semesterRecord.publishDate,
    totalCredits: totalCredits,
    earnedCredits: earnedCredits,
    totalGradePoints: parseFloat(totalGradePoints.toFixed(2)),
    sgpa: sgpa,
    courses: evaluatedCourses
  };
}

export function calculateStudentTranscript(student, publishedOnly = false) {
  if (!student) return null;

  const scale = dataStore.getGradingScale();
  const semesters = student.semesters || [];

  let cumulativeGradePoints = 0;
  let cumulativeCredits = 0;
  let cumulativeEarnedCredits = 0;

  const semesterAudits = [];
  const gradeDistribution = {};
  const categoryBreakdown = {};

  const sortedSemesters = [...semesters].sort((a, b) => a.semesterNumber - b.semesterNumber);

  for (const sem of sortedSemesters) {
    if (publishedOnly && !sem.isPublished) {
      continue;
    }

    const semAudit = calculateSemester(sem, scale);

    cumulativeCredits += semAudit.totalCredits;
    cumulativeEarnedCredits += semAudit.earnedCredits;
    cumulativeGradePoints += semAudit.totalGradePoints;

    const runningCgpa = cumulativeCredits > 0 ? parseFloat((cumulativeGradePoints / cumulativeCredits).toFixed(2)) : 0.00;
    semAudit.runningCgpa = runningCgpa;

    for (const c of semAudit.courses) {
      gradeDistribution[c.letter] = (gradeDistribution[c.letter] || 0) + 1;
      categoryBreakdown[c.category] = (categoryBreakdown[c.category] || 0) + c.credits;
    }

    semesterAudits.push(semAudit);
  }

  const cgpa = cumulativeCredits > 0 ? parseFloat((cumulativeGradePoints / cumulativeCredits).toFixed(2)) : 0.00;
  const classification = getDegreeClassification(cgpa);
  const degreeRequiredCredits = 128.0;
  const progressPercent = Math.min(100, Math.round((cumulativeEarnedCredits / degreeRequiredCredits) * 100));

  return {
    studentId: student.id,
    studentName: student.name,
    email: student.email,
    batch: student.batch,
    advisor: student.advisor,
    concentration: student.concentration,
    academicStatus: student.academicStatus,
    totalRegisteredCredits: cumulativeCredits,
    totalEarnedCredits: cumulativeEarnedCredits,
    degreeRequiredCredits: degreeRequiredCredits,
    progressPercent: progressPercent,
    cgpa: cgpa,
    classification: classification,
    totalGradePoints: parseFloat(cumulativeGradePoints.toFixed(2)),
    semesters: semesterAudits,
    gradeDistribution: gradeDistribution,
    categoryBreakdown: categoryBreakdown,
    hasDrafts: semesters.some((s) => !s.isPublished)
  };
}

export function simulateWhatIfGpa(currentTranscript, hypotheticalCourses = []) {
  let currentPoints = currentTranscript.totalGradePoints;
  let currentCredits = currentTranscript.totalRegisteredCredits;

  let simPoints = 0;
  let simCredits = 0;
  const scale = dataStore.getGradingScale();

  for (const hc of hypotheticalCourses) {
    const cr = parseFloat(hc.credits) || 4.0;
    const gr = getGradeFromMarks(hc.marks, scale);
    simPoints += cr * gr.point;
    simCredits += cr;
  }

  const projectedTotalCredits = currentCredits + simCredits;
  const projectedTotalPoints = currentPoints + simPoints;
  const projectedCgpa = projectedTotalCredits > 0 ? parseFloat((projectedTotalPoints / projectedTotalCredits).toFixed(2)) : 0.00;

  return {
    projectedCgpa: projectedCgpa,
    projectedClassification: getDegreeClassification(projectedCgpa),
    simCredits: simCredits,
    projectedTotalCredits: projectedTotalCredits,
    delta: parseFloat((projectedCgpa - currentTranscript.cgpa).toFixed(2))
  };
}
