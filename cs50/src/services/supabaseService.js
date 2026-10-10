/**
 * Supabase Database Service
 * Provides asynchronous data operations against Supabase Postgres tables,
 * with seamless fallback to DataStore when Supabase is unconfigured.
 */

import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { dataStore } from "./dataStore";
import { HARVARD_CSE_CURRICULUM } from "../data/curriculum";

export const supabaseService = {
  // Check if active
  isReady() {
    return isSupabaseConfigured();
  },

  // --- STUDENTS ---
  async getStudents() {
    if (!this.isReady()) {
      return dataStore.getStudents();
    }

    try {
      // Fetch students with their semesters and course results
      const { data: students, error: stdError } = await supabase
        .from("students")
        .select(`
          id, student_id, name, email, batch, current_semester,
          concentration, advisor, academic_status, avatar
        `)
        .order("student_id", { ascending: true });

      if (stdError) throw stdError;
      if (!students || students.length === 0) return [];

      // Fetch semesters
      const { data: semesters, error: semError } = await supabase
        .from("student_semesters")
        .select("*");

      if (semError) throw semError;

      // Fetch results
      const { data: results, error: resError } = await supabase
        .from("course_results")
        .select("*");

      if (resError) throw resError;

      // Assemble nested objects matching our data structure
      const assembled = students.map((st) => {
        const studentSemesters = (semesters || [])
          .filter((s) => s.student_id === st.student_id)
          .map((s) => {
            const semResults = (results || [])
              .filter((r) => r.student_id === st.student_id && r.semester_number === s.semester_number)
              .map((r) => ({
                courseCode: r.course_code,
                marks: parseFloat(r.marks),
                credits: parseFloat(r.credits)
              }));

            return {
              semesterNumber: s.semester_number,
              term: s.term,
              isPublished: Boolean(s.is_published),
              publishDate: s.publish_date,
              results: semResults
            };
          });

        return {
          id: st.student_id,
          name: st.name,
          email: st.email,
          batch: st.batch,
          currentSemester: st.current_semester,
          concentration: st.concentration,
          advisor: st.advisor,
          academicStatus: st.academic_status,
          avatar: st.avatar,
          semesters: studentSemesters
        };
      });

      // Synchronize to local storage cache
      dataStore.saveStudents(assembled);
      return assembled;
    } catch (err) {
      console.warn("Supabase getStudents error, using local cache:", err);
      return dataStore.getStudents();
    }
  },

  async addStudent(newStudent) {
    if (!this.isReady()) {
      return dataStore.addStudent(newStudent);
    }

    try {
      const { error: stdError } = await supabase.from("students").insert({
        student_id: newStudent.id,
        name: newStudent.name,
        email: newStudent.email,
        batch: newStudent.batch,
        current_semester: newStudent.currentSemester || 1,
        concentration: newStudent.concentration,
        advisor: newStudent.advisor,
        academic_status: newStudent.academicStatus,
        avatar: newStudent.avatar
      });

      if (stdError) throw stdError;

      // Also create initial semester record
      if (newStudent.semesters && newStudent.semesters.length > 0) {
        for (const s of newStudent.semesters) {
          await supabase.from("student_semesters").insert({
            student_id: newStudent.id,
            semester_number: s.semesterNumber,
            term: s.term,
            is_published: s.isPublished || false,
            publish_date: s.publishDate
          });
        }
      }

      dataStore.addStudent(newStudent);
      return newStudent;
    } catch (err) {
      console.error("Supabase addStudent error:", err);
      // Fallback
      return dataStore.addStudent(newStudent);
    }
  },

  async deleteStudent(studentId) {
    if (!this.isReady()) {
      return dataStore.deleteStudent(studentId);
    }

    try {
      await supabase.from("students").delete().eq("student_id", studentId);
      dataStore.deleteStudent(studentId);
    } catch (err) {
      console.error("Supabase deleteStudent error:", err);
      dataStore.deleteStudent(studentId);
    }
  },

  async updateStudentAvatar(studentId, avatarUrl) {
    if (!this.isReady()) {
      return dataStore.updateStudentAvatar(studentId, avatarUrl);
    }

    try {
      // 1. Update in students table
      const { error: stdError } = await supabase
        .from("students")
        .update({ avatar: avatarUrl })
        .eq("student_id", studentId);

      if (stdError) console.warn("Could not update students table avatar in Supabase:", stdError);

      // 2. Also update profiles table if a profile is linked
      await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("student_id", studentId);

      // 3. Update in local store
      return dataStore.updateStudentAvatar(studentId, avatarUrl);
    } catch (err) {
      console.error("Supabase updateStudentAvatar error:", err);
      return dataStore.updateStudentAvatar(studentId, avatarUrl);
    }
  },

  // --- PUBLICATION & GRADES ---
  async updateSemesterPublication(studentId, semesterNumber, isPublished) {
    if (!this.isReady()) {
      return dataStore.updateSemesterPublication(studentId, semesterNumber, isPublished);
    }

    try {
      const publishDate = isPublished ? new Date().toISOString().split("T")[0] : null;

      const { error } = await supabase.from("student_semesters").upsert({
        student_id: studentId,
        semester_number: parseInt(semesterNumber),
        term: `Semester ${semesterNumber}`,
        is_published: isPublished,
        publish_date: publishDate
      }, { onConflict: "student_id,semester_number" });

      if (error) throw error;
      dataStore.updateSemesterPublication(studentId, semesterNumber, isPublished);
    } catch (err) {
      console.error("Supabase updateSemesterPublication error:", err);
      dataStore.updateSemesterPublication(studentId, semesterNumber, isPublished);
    }
  },

  async batchPublishSemester(semesterNumber, isPublished) {
    if (!this.isReady()) {
      return dataStore.batchPublishSemester(semesterNumber, isPublished);
    }

    try {
      const publishDate = isPublished ? new Date().toISOString().split("T")[0] : null;

      const { data, error } = await supabase
        .from("student_semesters")
        .update({
          is_published: isPublished,
          publish_date: publishDate
        })
        .eq("semester_number", parseInt(semesterNumber));

      if (error) throw error;
      return dataStore.batchPublishSemester(semesterNumber, isPublished);
    } catch (err) {
      console.error("Supabase batchPublishSemester error:", err);
      return dataStore.batchPublishSemester(semesterNumber, isPublished);
    }
  },

  async updateCourseGrade(studentId, semesterNumber, courseCode, marks, credits) {
    if (!this.isReady()) {
      return dataStore.updateCourseGrade(studentId, semesterNumber, courseCode, marks, credits);
    }

    try {
      const courseInfo = dataStore.findCourseInCurriculum(courseCode);
      const cr = credits !== null && credits !== undefined ? parseFloat(credits) : (courseInfo ? courseInfo.credits : 4.0);

      // Ensure semester record exists
      await supabase.from("student_semesters").upsert({
        student_id: studentId,
        semester_number: parseInt(semesterNumber),
        term: `Semester ${semesterNumber}`,
        is_published: false
      }, { onConflict: "student_id,semester_number" });

      // Upsert course result
      const { error } = await supabase.from("course_results").upsert({
        student_id: studentId,
        semester_number: parseInt(semesterNumber),
        course_code: courseCode.trim().toUpperCase(),
        marks: parseFloat(marks) || 0,
        credits: cr
      }, { onConflict: "student_id,semester_number,course_code" });

      if (error) throw error;
      dataStore.updateCourseGrade(studentId, semesterNumber, courseCode, marks, cr);
    } catch (err) {
      console.error("Supabase updateCourseGrade error:", err);
      dataStore.updateCourseGrade(studentId, semesterNumber, courseCode, marks, credits);
    }
  },

  async removeCourseResult(studentId, semesterNumber, courseCode) {
    if (!this.isReady()) {
      return dataStore.removeCourseResult(studentId, semesterNumber, courseCode);
    }

    try {
      await supabase
        .from("course_results")
        .delete()
        .eq("student_id", studentId)
        .eq("semester_number", parseInt(semesterNumber))
        .eq("course_code", courseCode.trim().toUpperCase());

      dataStore.removeCourseResult(studentId, semesterNumber, courseCode);
    } catch (err) {
      console.error("Supabase removeCourseResult error:", err);
      dataStore.removeCourseResult(studentId, semesterNumber, courseCode);
    }
  },

  // --- SEED CURRICULUM IN SUPABASE ---
  async seedCurriculumToSupabase() {
    if (!this.isReady()) throw new Error("Supabase is not configured.");

    const flatCourses = [];
    HARVARD_CSE_CURRICULUM.forEach((s) => {
      s.courses.forEach((c) => {
        flatCourses.push({
          semester: s.semester,
          code: c.code,
          title: c.title,
          department: c.department,
          credits: c.credits,
          category: c.category,
          prerequisites: c.prerequisites,
          description: c.description
        });
      });
    });

    const { error } = await supabase
      .from("curriculum_courses")
      .upsert(flatCourses, { onConflict: "code" });

    if (error) throw error;
    return flatCourses.length;
  }
};
