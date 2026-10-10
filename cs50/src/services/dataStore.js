/**
 * DataStore Service for Harvard CSE Portal (React)
 * Clean, production-ready local persistence without hardcoded mock data.
 */

import { INITIAL_STUDENTS } from "../data/students";
import { HARVARD_CSE_CURRICULUM } from "../data/curriculum";
import { DEFAULT_GRADING_SCALE } from "../data/gradingScale";

const KEY_STUDENTS = "harvard_cse_react_students_live_v3";
const KEY_CURRICULUM = "harvard_cse_react_curriculum_live_v3";
const KEY_GRADING = "harvard_cse_react_grading_live_v3";

class DataStore {
  constructor() {
    this.listeners = new Set();
    this.cleanupLegacyMockData();
    this.init();
  }

  cleanupLegacyMockData() {
    // Remove previous mock storage keys
    const legacyKeys = [
      "harvard_cse_students_v1",
      "harvard_cse_curriculum_v1",
      "harvard_cse_grading_scale_v1",
      "harvard_cse_react_students_v2"
    ];
    legacyKeys.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch (e) {
        // ignore
      }
    });
  }

  init() {
    if (!localStorage.getItem(KEY_STUDENTS)) {
      localStorage.setItem(KEY_STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    }
    if (!localStorage.getItem(KEY_CURRICULUM)) {
      localStorage.setItem(KEY_CURRICULUM, JSON.stringify(HARVARD_CSE_CURRICULUM));
    }
    if (!localStorage.getItem(KEY_GRADING)) {
      localStorage.setItem(KEY_GRADING, JSON.stringify(DEFAULT_GRADING_SCALE));
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, data) {
    this.listeners.forEach((listener) => {
      try {
        listener(event, data);
      } catch (err) {
        console.error("Store listener error:", err);
      }
    });
  }

  // Students
  getStudents() {
    try {
      const data = localStorage.getItem(KEY_STUDENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  getStudentById(id) {
    if (!id) return null;
    const students = this.getStudents();
    return students.find((s) => s.id.toLowerCase() === id.trim().toLowerCase()) || null;
  }

  saveStudents(students) {
    localStorage.setItem(KEY_STUDENTS, JSON.stringify(students));
    this.notify("students_changed", students);
  }

  addStudent(student) {
    const students = this.getStudents();
    if (students.some((s) => s.id.toLowerCase() === student.id.toLowerCase())) {
      throw new Error(`Student with ID ${student.id} already exists`);
    }
    students.push(student);
    this.saveStudents(students);
    return student;
  }

  deleteStudent(id) {
    const students = this.getStudents().filter((s) => s.id !== id);
    this.saveStudents(students);
  }

  updateStudentAvatar(studentId, avatarUrl) {
    const students = this.getStudents();
    const student = students.find((s) => s.id.toLowerCase() === studentId.trim().toLowerCase());
    if (!student) throw new Error("Student not found");
    student.avatar = avatarUrl;
    this.saveStudents(students);
    return student;
  }

  updateSemesterPublication(studentId, semesterNumber, isPublished) {
    const students = this.getStudents();
    const student = students.find((s) => s.id === studentId);
    if (!student) throw new Error("Student not found");

    let sem = student.semesters.find((s) => s.semesterNumber === parseInt(semesterNumber));
    if (!sem) {
      sem = {
        semesterNumber: parseInt(semesterNumber),
        term: `Semester ${semesterNumber}`,
        isPublished: isPublished,
        publishDate: isPublished ? new Date().toISOString().split("T")[0] : null,
        results: []
      };
      student.semesters.push(sem);
    } else {
      sem.isPublished = isPublished;
      sem.publishDate = isPublished ? (sem.publishDate || new Date().toISOString().split("T")[0]) : null;
    }

    this.saveStudents(students);
    return sem;
  }

  batchPublishSemester(semesterNumber, isPublished) {
    const students = this.getStudents();
    const semNum = parseInt(semesterNumber);
    let count = 0;

    students.forEach((s) => {
      const sem = s.semesters.find((sm) => sm.semesterNumber === semNum);
      if (sem) {
        sem.isPublished = isPublished;
        sem.publishDate = isPublished ? (sem.publishDate || new Date().toISOString().split("T")[0]) : null;
        count++;
      }
    });

    this.saveStudents(students);
    return count;
  }

  updateCourseGrade(studentId, semesterNumber, courseCode, marks, credits = null) {
    const students = this.getStudents();
    const student = students.find((s) => s.id === studentId);
    if (!student) throw new Error("Student not found");

    let sem = student.semesters.find((s) => s.semesterNumber === parseInt(semesterNumber));
    if (!sem) {
      sem = {
        semesterNumber: parseInt(semesterNumber),
        term: `Semester ${semesterNumber}`,
        isPublished: false,
        publishDate: null,
        results: []
      };
      student.semesters.push(sem);
    }

    let result = sem.results.find((r) => r.courseCode.toUpperCase() === courseCode.toUpperCase());
    const courseInfo = this.findCourseInCurriculum(courseCode);
    const cr = credits !== null ? parseFloat(credits) : (courseInfo ? courseInfo.credits : 4.0);

    if (result) {
      result.marks = parseFloat(marks) || 0;
      result.credits = cr;
    } else {
      sem.results.push({
        courseCode: courseCode.toUpperCase(),
        marks: parseFloat(marks) || 0,
        credits: cr
      });
    }

    this.saveStudents(students);
  }

  removeCourseResult(studentId, semesterNumber, courseCode) {
    const students = this.getStudents();
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const sem = student.semesters.find((s) => s.semesterNumber === parseInt(semesterNumber));
    if (sem) {
      sem.results = sem.results.filter((r) => r.courseCode.toUpperCase() !== courseCode.toUpperCase());
      this.saveStudents(students);
    }
  }

  // Curriculum
  getCurriculum() {
    try {
      const data = localStorage.getItem(KEY_CURRICULUM);
      return data ? JSON.parse(data) : HARVARD_CSE_CURRICULUM;
    } catch {
      return HARVARD_CSE_CURRICULUM;
    }
  }

  saveCurriculum(curr) {
    localStorage.setItem(KEY_CURRICULUM, JSON.stringify(curr));
    this.notify("curriculum_changed", curr);
  }

  findCourseInCurriculum(code) {
    const curr = this.getCurriculum();
    const clean = (code || "").trim().toUpperCase();
    for (const sem of curr) {
      for (const c of sem.courses) {
        if (c.code.trim().toUpperCase() === clean) return c;
      }
    }
    return null;
  }

  addCourseToCurriculum(semesterNumber, course) {
    const curr = this.getCurriculum();
    const sem = curr.find((s) => s.semester === parseInt(semesterNumber));
    if (!sem) throw new Error(`Semester ${semesterNumber} not found in curriculum`);
    sem.courses.push(course);
    this.saveCurriculum(curr);
  }

  // Grading
  getGradingScale() {
    try {
      const data = localStorage.getItem(KEY_GRADING);
      return data ? JSON.parse(data) : DEFAULT_GRADING_SCALE;
    } catch {
      return DEFAULT_GRADING_SCALE;
    }
  }

  // System Tools
  resetToDefaults() {
    localStorage.setItem(KEY_STUDENTS, JSON.stringify([]));
    localStorage.setItem(KEY_CURRICULUM, JSON.stringify(HARVARD_CSE_CURRICULUM));
    localStorage.setItem(KEY_GRADING, JSON.stringify(DEFAULT_GRADING_SCALE));
    this.notify("reset", null);
  }

  exportJson() {
    return JSON.stringify({
      students: this.getStudents(),
      curriculum: this.getCurriculum(),
      gradingScale: this.getGradingScale(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  importJson(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (parsed.students) localStorage.setItem(KEY_STUDENTS, JSON.stringify(parsed.students));
    if (parsed.curriculum) localStorage.setItem(KEY_CURRICULUM, JSON.stringify(parsed.curriculum));
    if (parsed.gradingScale) localStorage.setItem(KEY_GRADING, JSON.stringify(parsed.gradingScale));
    this.notify("imported", parsed);
  }
}

export const dataStore = new DataStore();
