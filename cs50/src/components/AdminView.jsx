import React, { useState, useMemo, useEffect } from "react";
import { dataStore } from "../services/dataStore";
import { supabaseService } from "../services/supabaseService";
import { calculateSemester, calculateStudentTranscript } from "../services/academicCalculator";
import { getGradeFromMarks } from "../data/gradingScale";
import { useAuth } from "../context/AuthContext";
import { ProfileImageModal } from "./ProfileImageModal";

export function AdminView({ onOpenNewStudent, onOpenCurriculum, onOpenAuth, onShowToast }) {
  const { isAdmin, isAuthenticated } = useAuth();
  const [subtab, setSubtab] = useState("grades");
  const [syncing, setSyncing] = useState(false);
  const [avatarModalStudent, setAvatarModalStudent] = useState(null);
  const students = dataStore.getStudents();
  const curriculum = dataStore.getCurriculum();
  const gradingScale = dataStore.getGradingScale();

  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || "");
  const [selectedSemesterNumber, setSelectedSemesterNumber] = useState(1);
  const [, setForceUpdate] = useState(0);

  // Sync from Supabase on mount if configured
  useEffect(() => {
    async function loadRemoteData() {
      if (supabaseService.isReady()) {
        try {
          await supabaseService.getStudents();
          setForceUpdate((v) => v + 1);
        } catch (e) {
          console.warn("Failed remote sync:", e);
        }
      }
    }
    loadRemoteData();
  }, []);

  const totalCourses = curriculum.reduce((acc, s) => acc + s.courses.length, 0);

  // Compute KPI statistics
  const { publishedCount, draftCount, avgCgpa } = useMemo(() => {
    let pub = 0;
    let dft = 0;
    let cgpaSum = 0;
    let gradedStudents = 0;

    students.forEach((st) => {
      const tr = calculateStudentTranscript(st, false);
      if (tr.totalRegisteredCredits > 0) {
        cgpaSum += tr.cgpa;
        gradedStudents++;
      }
      (st.semesters || []).forEach((sem) => {
        if (sem.isPublished) pub++;
        else dft++;
      });
    });

    return {
      publishedCount: pub,
      draftCount: dft,
      avgCgpa: gradedStudents > 0 ? (cgpaSum / gradedStudents).toFixed(2) : "—"
    };
  }, [students]);

  // Current student & semester record
  const currentStudent = dataStore.getStudentById(selectedStudentId) || students[0];
  const semesterRecord = (currentStudent?.semesters || []).find((s) => s.semesterNumber === parseInt(selectedSemesterNumber));
  const isPublished = Boolean(semesterRecord?.isPublished);

  const semAudit = semesterRecord ? calculateSemester(semesterRecord) : {
    totalCredits: 0,
    earnedCredits: 0,
    totalGradePoints: 0,
    sgpa: 0,
    courses: []
  };

  // Auth gate check
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="univ-card" style={{ textAlign: "center", padding: "4rem 2rem", maxWidth: "600px", margin: "2rem auto" }}>
        <svg style={{ width: "56px", height: "56px", margin: "0 auto 1.25rem", color: "var(--harvard-crimson)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Registrar Administrator Access Restricted
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
          Only authorized Harvard University SEAS examination officers and academic registrars are permitted to publish semester results, enter marks, and enroll students.
        </p>
        <button
          type="button"
          className="btn-harvard"
          style={{ padding: "0.75rem 1.5rem", fontSize: "0.9rem" }}
          onClick={() => onOpenAuth("admin")}
        >
          Sign In as Administrator
        </button>
      </div>
    );
  }

  // Handlers with Supabase sync
  const handleTogglePublication = async (e) => {
    if (!currentStudent) return;
    const checked = e.target.checked;
    await supabaseService.updateSemesterPublication(currentStudent.id, selectedSemesterNumber, checked);
    onShowToast?.(
      checked
        ? `Semester ${selectedSemesterNumber} published! Visible to student.`
        : `Semester ${selectedSemesterNumber} marked as Draft.`,
      checked ? "success" : "info"
    );
    setForceUpdate((v) => v + 1);
  };

  const handleBatchPublish = async () => {
    if (students.length === 0) {
      alert("No students enrolled yet.");
      return;
    }
    if (window.confirm(`Publish Semester ${selectedSemesterNumber} for ALL registered students?`)) {
      const count = await supabaseService.batchPublishSemester(selectedSemesterNumber, true);
      onShowToast?.(`Published Semester ${selectedSemesterNumber} for ${count} students.`, "success");
      setForceUpdate((v) => v + 1);
    }
  };

  const handleLoadCurriculumCourses = async () => {
    if (!currentStudent) {
      alert("Please select or enroll a student first.");
      return;
    }
    const targetSem = curriculum.find((s) => s.semester === parseInt(selectedSemesterNumber));
    if (targetSem) {
      for (const c of targetSem.courses) {
        await supabaseService.updateCourseGrade(currentStudent.id, selectedSemesterNumber, c.code, 0, c.credits);
      }
      onShowToast?.(`Loaded ${targetSem.courses.length} courses from Harvard Syllabus for Semester ${selectedSemesterNumber}. Ready for marks entry.`, "success");
      setForceUpdate((v) => v + 1);
    }
  };

  const handleAddCourseRow = async () => {
    if (!currentStudent) {
      alert("Please select or enroll a student first.");
      return;
    }
    const code = window.prompt("Enter Course Code (e.g. CS 143, CS 181):", "CS 143");
    if (code) {
      const marks = window.prompt("Enter initial marks percentage (0-100):", "0");
      if (marks !== null) {
        await supabaseService.updateCourseGrade(currentStudent.id, selectedSemesterNumber, code.trim(), parseFloat(marks) || 0);
        onShowToast?.(`Course ${code} added to Semester ${selectedSemesterNumber}.`, "success");
        setForceUpdate((v) => v + 1);
      }
    }
  };

  const handleRemoveCourse = async (code) => {
    if (!currentStudent) return;
    if (window.confirm(`Remove ${code} from Semester ${selectedSemesterNumber}?`)) {
      await supabaseService.removeCourseResult(currentStudent.id, selectedSemesterNumber, code);
      onShowToast?.(`Removed ${code}.`, "info");
      setForceUpdate((v) => v + 1);
    }
  };

  const handleGradeInputChange = async (code, marks, credits) => {
    if (!currentStudent) return;
    await supabaseService.updateCourseGrade(currentStudent.id, selectedSemesterNumber, code, marks, credits);
    setForceUpdate((v) => v + 1);
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm(`Permanently remove student ${id}?`)) {
      await supabaseService.deleteStudent(id);
      if (selectedStudentId === id) {
        setSelectedStudentId(students.find((s) => s.id !== id)?.id || "");
      }
      onShowToast?.(`Student ${id} removed.`, "info");
      setForceUpdate((v) => v + 1);
    }
  };

  const handleSyncRemote = async () => {
    setSyncing(true);
    try {
      await supabaseService.getStudents();
      onShowToast?.("Synchronized latest student records with database.", "success");
      setForceUpdate((v) => v + 1);
    } catch (err) {
      alert("Sync failed: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = () => {
    const jsonStr = dataStore.exportJson();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `harvard-cse-portal-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast?.("Backup JSON downloaded.", "success");
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        dataStore.importJson(evt.target.result);
        onShowToast?.("Database imported successfully!", "success");
        setForceUpdate((v) => v + 1);
      } catch (err) {
        alert("Invalid file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (window.confirm("Clear all student transcripts and start with a fresh empty registry?")) {
      dataStore.resetToDefaults();
      setSelectedStudentId("");
      onShowToast?.("System reset to clean baseline.", "info");
      setForceUpdate((v) => v + 1);
    }
  };

  return (
    <div>
      {/* Admin Title Strip */}
      <div className="admin-header-strip">
        <div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", color: "var(--text-main)", fontWeight: 800 }}>
            Office of the Registrar & Academic Affairs
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            Harvard John A. Paulson School of Engineering and Applied Sciences &bull; Examination Operations
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button type="button" className="btn-secondary" onClick={handleSyncRemote} disabled={syncing}>
            {syncing ? "Syncing..." : "Sync Cloud DB"}
          </button>
          <button type="button" className="btn-secondary" onClick={handleExport}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export Backup
          </button>
          <button type="button" className="btn-harvard" onClick={onOpenNewStudent}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            Enroll Student
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="kpi-metrics-row">
        <div className="kpi-tile">
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "0.74rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Enrolled Students</div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", fontWeight: 800 }}>{students.length}</div>
          </div>
        </div>

        <div className="kpi-tile">
          <div className="kpi-icon" style={{ color: "#166534", background: "#DCFCE7" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "0.74rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Published Terms</div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", fontWeight: 800, color: "#166534" }}>{publishedCount}</div>
          </div>
        </div>

        <div className="kpi-tile">
          <div className="kpi-icon" style={{ color: "#B45309", background: "#FEF3C7" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "0.74rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Pending Drafts</div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", fontWeight: 800, color: "#B45309" }}>{draftCount}</div>
          </div>
        </div>

        <div className="kpi-tile">
          <div className="kpi-icon" style={{ color: "#1D4ED8", background: "#DBEAFE" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "0.74rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Harvard CS Courses</div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", fontWeight: 800 }}>{totalCourses}</div>
          </div>
        </div>

        <div className="kpi-tile">
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "0.74rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Cohort Avg CGPA</div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", fontWeight: 800, color: "var(--harvard-crimson)" }}>{avgCgpa}</div>
          </div>
        </div>
      </div>

      {/* Admin Subnav */}
      <div className="admin-subnav-pills">
        <button type="button" className={`admin-subnav-pill ${subtab === "grades" ? "active" : ""}`} onClick={() => setSubtab("grades")}>
          Result Publication & Grade Entry
        </button>
        <button type="button" className={`admin-subnav-pill ${subtab === "roster" ? "active" : ""}`} onClick={() => setSubtab("roster")}>
          Student Roster Directory
        </button>
        <button type="button" className={`admin-subnav-pill ${subtab === "curriculum" ? "active" : ""}`} onClick={() => setSubtab("curriculum")}>
          Harvard CS Curriculum
        </button>
        <button type="button" className={`admin-subnav-pill ${subtab === "scale" ? "active" : ""}`} onClick={() => setSubtab("scale")}>
          Grading Scale Setup (4.0)
        </button>
        <button type="button" className={`admin-subnav-pill ${subtab === "tools" ? "active" : ""}`} onClick={() => setSubtab("tools")}>
          Data Center & System Tools
        </button>
      </div>

      {/* SUBTAB 1: GRADE ENTRY & RESULT PUBLISHER */}
      {subtab === "grades" && (
        <div className="univ-card">
          {students.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", fontSize: "0.95rem" }}>
                No students currently enrolled in the registry.
              </p>
              <button type="button" className="btn-harvard" onClick={onOpenNewStudent}>
                + Enroll Student Now
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: "1.25rem", borderBottom: "1.5px solid var(--border-light)", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", flex: 1 }}>
                  <div style={{ minWidth: "260px" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Select Enrolled Student:
                    </label>
                    <select
                      className="search-input-box"
                      style={{ width: "100%", background: "#FFFFFF" }}
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.id}) &bull; Sem {s.currentSemester}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ minWidth: "180px" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Semester Number:
                    </label>
                    <select
                      className="search-input-box"
                      style={{ width: "100%", background: "#FFFFFF" }}
                      value={selectedSemesterNumber}
                      onChange={(e) => setSelectedSemesterNumber(parseInt(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <option key={num} value={num}>
                          Semester {num}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Publication Controller Switch */}
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", background: "var(--bg-page)", padding: "0.75rem 1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                  <div>
                    <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 800 }}>Result Publication</div>
                    <div style={{ fontWeight: 800, fontSize: "0.92rem", color: isPublished ? "#166534" : "#B45309" }}>
                      {isPublished ? "● PUBLISHED (LIVE)" : "○ DRAFT (HIDDEN)"}
                    </div>
                  </div>

                  <label className="switch-input" title="Toggle publication status">
                    <input type="checkbox" checked={isPublished} onChange={handleTogglePublication} />
                    <span className="switch-slider" />
                  </label>

                  <button type="button" className="btn-secondary" style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem" }} onClick={handleBatchPublish}>
                    Publish for All Students
                  </button>
                </div>
              </div>

              {/* Marks Entry Table */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Course Marks Matrix & Grading (Semester {selectedSemesterNumber})
                </h4>
                <button type="button" className="btn-secondary" style={{ fontSize: "0.82rem" }} onClick={handleAddCourseRow}>
                  + Add Course Row
                </button>
              </div>

              <div className="data-table-wrapper">
                <table className="academic-table">
                  <thead>
                    <tr>
                      <th style={{ width: "130px" }}>Course Code</th>
                      <th>Course Title</th>
                      <th style={{ width: "90px", textAlign: "center" }}>Credits</th>
                      <th style={{ width: "130px", textAlign: "center" }}>Marks (0-100%)</th>
                      <th style={{ width: "90px", textAlign: "center" }}>Letter</th>
                      <th style={{ width: "90px", textAlign: "center" }}>Grade Point</th>
                      <th style={{ width: "100px", textAlign: "center" }}>Total Points</th>
                      <th style={{ width: "70px", textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semAudit.courses.length > 0 ? (
                      semAudit.courses.map((c) => {
                        const grade = getGradeFromMarks(c.marks, gradingScale);
                        return (
                          <tr key={c.courseCode}>
                            <td className="code-badge">{c.courseCode}</td>
                            <td>{c.courseTitle}</td>
                            <td style={{ textAlign: "center" }}>
                              <input
                                type="number"
                                className="search-input-box"
                                style={{ width: "65px", padding: "4px", textAlign: "center", background: "#FFFFFF", margin: "0 auto" }}
                                value={c.credits}
                                step="0.5"
                                min="1"
                                max="12"
                                onChange={(e) => handleGradeInputChange(c.courseCode, c.marks, parseFloat(e.target.value) || 4.0)}
                              />
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <input
                                type="number"
                                className="search-input-box"
                                style={{ width: "80px", padding: "4px", textAlign: "center", fontWeight: 700, color: "var(--harvard-crimson)", background: "#FFFFFF", margin: "0 auto" }}
                                value={c.marks}
                                min="0"
                                max="100"
                                step="0.5"
                                onChange={(e) => handleGradeInputChange(c.courseCode, parseFloat(e.target.value) || 0, c.credits)}
                              />
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span className="grade-badge-pill" style={{ backgroundColor: grade.letter.startsWith("A") ? "#A51C30" : "#C92A3E" }}>
                                {grade.letter}
                              </span>
                            </td>
                            <td style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                              {grade.point.toFixed(2)}
                            </td>
                            <td style={{ textAlign: "center", fontFamily: "var(--font-mono)" }}>
                              {(c.credits * grade.point).toFixed(2)}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ padding: "2px 8px", fontSize: "0.85rem", color: "#DC2626" }}
                                onClick={() => handleRemoveCourse(c.courseCode)}
                                title="Delete Course Result"
                              >
                                &times;
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                          No course records for Semester {selectedSemesterNumber} yet. Click <strong>Load Harvard Semester {selectedSemesterNumber} Syllabus Defaults</strong> to populate courses.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Live computed summary */}
              <div className="sem-summary-strip" style={{ marginTop: "1.25rem" }}>
                <div className="metric-cell">
                  <span className="metric-cell-title">Semester Total Credits</span>
                  <span className="metric-cell-value">{semAudit.totalCredits.toFixed(1)} Cr</span>
                </div>
                <div className="metric-cell">
                  <span className="metric-cell-title">Credits Earned</span>
                  <span className="metric-cell-value">{semAudit.earnedCredits.toFixed(1)} Cr</span>
                </div>
                <div className="metric-cell">
                  <span className="metric-cell-title">Total Grade Points</span>
                  <span className="metric-cell-value">{semAudit.totalGradePoints.toFixed(2)}</span>
                </div>
                <div className="metric-cell">
                  <span className="metric-cell-title">Computed SGPA</span>
                  <span className="metric-cell-value crimson">{semAudit.sgpa.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="button" className="btn-secondary" onClick={handleLoadCurriculumCourses}>
                  Load Harvard Semester {selectedSemesterNumber} Syllabus Defaults
                </button>
                <button
                  type="button"
                  className="btn-harvard"
                  onClick={() => {
                    onShowToast?.(`Saved & updated Semester ${selectedSemesterNumber} results for ${currentStudent.name}!`, "success");
                  }}
                >
                  Save Results
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* SUBTAB 2: STUDENT ROSTER */}
      {subtab === "roster" && (
        <div className="univ-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", fontWeight: 800 }}>Student Roster Directory</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Manage registered Harvard CSE undergraduates and transcripts</p>
            </div>
            <button type="button" className="btn-harvard" onClick={onOpenNewStudent}>
              + Enroll New Student
            </button>
          </div>

          <div className="data-table-wrapper">
            <table className="academic-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Cohort / Batch</th>
                  <th>Concentration</th>
                  <th>Advisor</th>
                  <th style={{ textAlign: "center" }}>Credits</th>
                  <th style={{ textAlign: "center" }}>Cumulative CGPA</th>
                  <th style={{ textAlign: "center" }}>Honors Standing</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                      No students currently registered. Click <strong>+ Enroll New Student</strong> above to add student records.
                    </td>
                  </tr>
                ) : (
                  students.map((s) => {
                    const tr = calculateStudentTranscript(s, false);
                    return (
                      <tr key={s.id}>
                        <td className="code-badge">{s.id}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <img
                              src={s.avatar}
                              alt={s.name}
                              style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", cursor: "pointer", border: "1.5px solid var(--border-light)" }}
                              title="Click to change photo"
                              onClick={() => setAvatarModalStudent(s)}
                              onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=A51C30&color=fff`; }}
                            />
                            <div>
                              <div style={{ fontWeight: 600 }}>{s.name}</div>
                              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{s.batch}</td>
                        <td>
                          <span style={{ fontSize: "0.76rem", padding: "2px 8px", background: "var(--bg-page)", border: "1px solid var(--border-light)", borderRadius: "4px" }}>
                            {s.concentration}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{s.advisor}</td>
                        <td style={{ textAlign: "center", fontFamily: "var(--font-mono)" }}>{tr.totalEarnedCredits} / 128</td>
                        <td style={{ textAlign: "center", fontFamily: "var(--font-serif)", fontWeight: 800, fontSize: "1.05rem", color: "var(--harvard-crimson)" }}>
                          {tr.cgpa > 0 ? tr.cgpa.toFixed(2) : "—"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`honors-badge ${tr.classification.badgeClass}`} style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                            {tr.classification.title.split("(")[0]}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ fontSize: "0.75rem", padding: "3px 8px" }}
                              onClick={() => setAvatarModalStudent(s)}
                              title="Change Student Photo"
                            >
                              Photo
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ fontSize: "0.75rem", padding: "3px 8px" }}
                              onClick={() => {
                                setSelectedStudentId(s.id);
                                setSubtab("grades");
                              }}
                            >
                              Grades
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ fontSize: "0.75rem", padding: "3px 8px", color: "#DC2626" }}
                              onClick={() => handleDeleteStudent(s.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: CURRICULUM */}
      {subtab === "curriculum" && (
        <div className="univ-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", fontWeight: 800 }}>Harvard University SEAS Computer Science Syllabus</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Accredited 8-Semester Curriculum Roadmap for B.Sc. in CSE (128 Credits)</p>
            </div>
            <button type="button" className="btn-harvard" onClick={onOpenCurriculum}>
              Explore Full Syllabus Guide
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {curriculum.map((sem) => (
              <div key={sem.semester} style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "1.25rem", background: "var(--bg-page)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h4 style={{ fontFamily: "var(--font-serif)", color: "var(--harvard-crimson-dark)", fontWeight: 700 }}>{sem.termName}</h4>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)" }}>
                    {sem.courses.length} Courses &bull; {(sem.courses.reduce((a, c) => a + c.credits, 0)).toFixed(1)} Credits
                  </span>
                </div>

                <div className="data-table-wrapper" style={{ margin: 0 }}>
                  <table className="academic-table">
                    <thead>
                      <tr>
                        <th style={{ width: "120px" }}>Code</th>
                        <th>Course Title</th>
                        <th style={{ width: "160px" }}>Area</th>
                        <th style={{ width: "80px", textAlign: "center" }}>Credits</th>
                        <th>Prerequisites</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sem.courses.map((c) => (
                        <tr key={c.code}>
                          <td className="code-badge">{c.code}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{c.title}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.description}</div>
                          </td>
                          <td>
                            <span style={{ fontSize: "0.76rem", padding: "2px 8px", background: "#FFFFFF", border: "1px solid var(--border-light)", borderRadius: "4px" }}>
                              {c.category}
                            </span>
                          </td>
                          <td style={{ textAlign: "center", fontFamily: "var(--font-mono)" }}>{c.credits.toFixed(1)}</td>
                          <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{c.prerequisites}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: GRADING POLICY */}
      {subtab === "scale" && (
        <div className="univ-card">
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Harvard FAS / SEAS 4.0 Standard Grading Brackets
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
            Grade points and letter grade thresholds for Bachelor of Science in Computer Science & Engineering
          </p>

          <div className="data-table-wrapper">
            <table className="academic-table">
              <thead>
                <tr>
                  <th style={{ width: "100px", textAlign: "center" }}>Letter</th>
                  <th style={{ width: "140px", textAlign: "center" }}>Min Marks (%)</th>
                  <th style={{ width: "140px", textAlign: "center" }}>Max Marks (%)</th>
                  <th style={{ width: "130px", textAlign: "center" }}>Grade Point (GP)</th>
                  <th>Performance Quality</th>
                </tr>
              </thead>
              <tbody>
                {gradingScale.map((s) => (
                  <tr key={s.letter}>
                    <td style={{ textAlign: "center" }}>
                      <span className="grade-badge-pill" style={{ backgroundColor: s.letter.startsWith("A") ? "#A51C30" : "#C92A3E" }}>
                        {s.letter}
                      </span>
                    </td>
                    <td style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{s.minMarks}%</td>
                    <td style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{s.maxMarks}%</td>
                    <td style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--harvard-crimson)" }}>
                      {s.point.toFixed(2)}
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.quality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 5: SYSTEM TOOLS */}
      {subtab === "tools" && (
        <div className="univ-card">
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", fontWeight: 800, marginBottom: "1.25rem" }}>
            Database Backup & Recovery
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            <div style={{ background: "var(--bg-page)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "1.5rem" }}>
              <h4 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Export System JSON</h4>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Download a complete JSON snapshot containing all student records, transcripts, and curriculum.
              </p>
              <button type="button" className="btn-secondary" onClick={handleExport}>
                Export Backup
              </button>
            </div>

            <div style={{ background: "var(--bg-page)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "1.5rem" }}>
              <h4 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Restore from JSON</h4>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Upload a JSON backup to restore saved student transcripts.
              </p>
              <input type="file" accept=".json" onChange={handleImportFile} style={{ fontSize: "0.85rem" }} />
            </div>

            <div style={{ background: "var(--harvard-crimson-surface)", border: "1px solid var(--harvard-crimson-border)", borderRadius: "var(--radius-md)", padding: "1.5rem" }}>
              <h4 style={{ color: "var(--harvard-crimson-dark)", fontWeight: 700, marginBottom: "0.5rem" }}>Clear Registry to Empty</h4>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Removes all student records and starts with a pristine, empty student registry.
              </p>
              <button type="button" className="btn-harvard" onClick={handleResetDefaults}>
                Clear All Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Image Modal for Admin */}
      {avatarModalStudent && (
        <ProfileImageModal
          student={avatarModalStudent}
          onClose={() => setAvatarModalStudent(null)}
          onUpdated={() => {
            setAvatarModalStudent(null);
            onShowToast?.("Student profile photo updated successfully!", "success");
            setForceUpdate((v) => v + 1);
          }}
        />
      )}
    </div>
  );
}
