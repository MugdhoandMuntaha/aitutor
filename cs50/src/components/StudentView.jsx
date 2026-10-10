import React, { useState, useMemo, useEffect } from "react";
import { calculateStudentTranscript, simulateWhatIfGpa } from "../services/academicCalculator";
import { dataStore } from "../services/dataStore";
import { supabaseService } from "../services/supabaseService";
import { ProfileImageModal } from "./ProfileImageModal";

export function StudentView({ currentStudentId, setCurrentStudentId, onOpenTranscript }) {
  const [searchInput, setSearchInput] = useState(currentStudentId || "");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [isSearching, setIsSearching] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [, setStoreVersion] = useState(0);

  // Subscribe to real-time dataStore updates
  useEffect(() => {
    const unsub = dataStore.subscribe(() => {
      setStoreVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  // Keep search input synced when prop updates
  useEffect(() => {
    if (currentStudentId) {
      setSearchInput(currentStudentId);
    }
  }, [currentStudentId]);

  // If currentStudentId was specified but record is not in local store yet, fetch from Supabase
  useEffect(() => {
    async function loadRemoteStudent() {
      if (currentStudentId && !dataStore.getStudentById(currentStudentId) && supabaseService.isReady()) {
        setIsSearching(true);
        try {
          await supabaseService.getStudents();
        } catch (err) {
          console.warn("Error fetching student record from Supabase:", err);
        } finally {
          setIsSearching(false);
        }
      }
    }
    loadRemoteStudent();
  }, [currentStudentId]);
  
  // What-If Simulator initialized clean with empty list
  const [simCourses, setSimCourses] = useState([]);

  const currentStudent = dataStore.getStudentById(currentStudentId);

  // Calculate transcript (publishedOnly = true for authentic student experience)
  const transcript = useMemo(() => {
    if (!currentStudent) return null;
    return calculateStudentTranscript(currentStudent, true);
  }, [currentStudent]);

  // Handle Search submit
  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;

    setIsSearching(true);
    let match = dataStore.getStudentById(query);
    if (!match && supabaseService.isReady()) {
      try {
        await supabaseService.getStudents();
        match = dataStore.getStudentById(query);
      } catch (err) {
        console.warn("Supabase lookup error:", err);
      }
    }
    setIsSearching(false);

    if (match) {
      setCurrentStudentId(match.id);
      setSelectedSemester("all");
    } else {
      alert(`No academic record found for Student ID "${query}". Please check the ID or contact the Registrar.`);
    }
  };

  // What-If Projection Calculation
  const simulationResult = useMemo(() => {
    if (!transcript) return null;
    return simulateWhatIfGpa(transcript, simCourses);
  }, [transcript, simCourses]);

  const handleSimAddCourse = () => {
    setSimCourses([...simCourses, { name: `Course ${simCourses.length + 1}`, credits: 4.0, marks: 90 }]);
  };

  const handleSimRemoveCourse = (index) => {
    setSimCourses(simCourses.filter((_, i) => i !== index));
  };

  const handleSimChange = (index, field, value) => {
    const updated = [...simCourses];
    updated[index][field] = field === "name" ? value : parseFloat(value) || 0;
    setSimCourses(updated);
  };

  const gradingScale = dataStore.getGradingScale();

  return (
    <div>
      {/* Official Student Lookup Ribbon */}
      <div className="student-lookup-ribbon">
        <form className="search-input-group" onSubmit={handleSearch} style={{ maxWidth: "600px", width: "100%" }}>
          <input
            type="text"
            className="search-input-box"
            placeholder="Enter Student ID (e.g. HAR-CS-2025-001)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn-harvard" disabled={isSearching}>
            {isSearching ? "Searching..." : "Search Record"}
          </button>
        </form>
      </div>

      {/* When searching or no student is selected/found */}
      {isSearching && !currentStudent ? (
        <div className="univ-card" style={{ textAlign: "center", padding: "3.5rem 2rem" }}>
          <div style={{ display: "inline-block", width: "36px", height: "36px", border: "3px solid #E5E7EB", borderTop: "3px solid var(--harvard-crimson)", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: "1rem" }} />
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Querying official academic database for student record...
          </p>
        </div>
      ) : !currentStudent ? (
        <div className="univ-card" style={{ textAlign: "center", padding: "3.5rem 2rem" }}>
          <svg style={{ width: "56px", height: "56px", margin: "0 auto 1rem", color: "var(--harvard-crimson)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Harvard University SEAS &bull; Student Academic Portal
          </h3>
          <p style={{ color: "var(--text-secondary)", maxWidth: "560px", margin: "0 auto 1.5rem", fontSize: "0.9rem" }}>
            Enter your official Student Identification Number above to view published semester transcripts, SGPA/CGPA calculations, course credit audits, and printable grade sheets.
          </p>
          <div style={{ display: "inline-block", background: "var(--bg-page)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "0.75rem 1.25rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Academic records are officially published and certified by the Harvard SEAS Office of the Registrar.
          </div>
        </div>
      ) : (
        /* When student record exists */
        <>
          {/* Student Profile Hero Card */}
          <div className="student-profile-hero">
            <div className="hero-layout-grid">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  className="hero-avatar-box profile-avatar-interactive"
                  onClick={() => setIsAvatarModalOpen(true)}
                  title="Click to change profile photo"
                >
                  <img
                    className="hero-avatar-img"
                    src={currentStudent.avatar}
                    alt={currentStudent.name}
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentStudent.name)}&background=A51C30&color=fff`;
                    }}
                  />
                  <div className="avatar-edit-overlay">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                    <span>Edit Photo</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-change-avatar"
                  onClick={() => setIsAvatarModalOpen(true)}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                  Update Photo
                </button>
              </div>

              <div className="student-main-info">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                  <h2>{currentStudent.name}</h2>
                  <span className={`honors-badge ${transcript.classification.badgeClass}`}>
                    {transcript.classification.title}
                  </span>
                </div>
                <div className="degree-subtext">
                  Bachelor of Science in Computer Science & Engineering &bull; {currentStudent.batch}
                </div>

                <div className="info-pills-row">
                  <span className="info-pill">
                    Student ID: <strong>{currentStudent.id}</strong>
                  </span>
                  <span className="info-pill">
                    Concentration: <strong>{currentStudent.concentration}</strong>
                  </span>
                  <span className="info-pill">
                    Advisor: <strong>{currentStudent.advisor}</strong>
                  </span>
                  <span className="info-pill">
                    Status: <strong>{currentStudent.academicStatus}</strong>
                  </span>
                </div>
              </div>

              <div className="cgpa-highlight-card">
                <span className="cgpa-metric-title">Cumulative CGPA</span>
                <span className="cgpa-big-number">{transcript.cgpa.toFixed(2)}</span>
                <span className="cgpa-scale-max">out of 4.00 Grade Scale</span>
                <button
                  type="button"
                  className="btn-harvard"
                  style={{ fontSize: "0.78rem", padding: "0.45rem 0.9rem" }}
                  onClick={() => onOpenTranscript(currentStudent.id)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9V2h12v7"></path>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                  Official Transcript
                </button>
              </div>
            </div>

            <div className="degree-progress-block">
              <div className="progress-labels">
                <span>
                  B.Sc. CSE Degree Requirement:{" "}
                  <strong>
                    {transcript.totalEarnedCredits} / {transcript.degreeRequiredCredits} Credits Completed
                  </strong>
                </span>
                <span>
                  <strong>{transcript.progressPercent}%</strong> Fulfilled
                </span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-crimson-fill" style={{ width: `${transcript.progressPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Analytics: SGPA Progression & Grade Distribution */}
          <div className="analytics-two-col">
            <div className="univ-card">
              <div className="card-title-row">
                <h3>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--harvard-crimson)" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                  Academic Trajectory & SGPA Progression
                </h3>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {transcript.semesters.length} Semesters Published
                </span>
              </div>

              <div className="chart-wrapper-box">
                {renderProgressionSvg(transcript.semesters)}
              </div>
            </div>

            <div className="univ-card">
              <div className="card-title-row">
                <h3>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--harvard-crimson)" strokeWidth="2">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                    <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                  </svg>
                  Grade Distribution
                </h3>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  {Object.values(transcript.gradeDistribution).reduce((a, b) => a + b, 0)} Courses Completed
                </span>
              </div>

              <div>
                {gradingScale.slice(0, 6).map((g) => {
                  const count = transcript.gradeDistribution[g.letter] || 0;
                  const total = Object.values(transcript.gradeDistribution).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={g.letter} className="grade-item-row">
                      <span className="grade-tag-label">{g.letter}</span>
                      <div className="grade-track">
                        <div
                          className="grade-fill"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: g.letter.startsWith("A") ? "#A51C30" : "#C92A3E"
                          }}
                        />
                      </div>
                      <span className="grade-count-number">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Semester Results Breakdown */}
          <div className="results-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
              <div className="semester-tabs-container" style={{ margin: 0, border: "none" }}>
                <button
                  type="button"
                  className={`sem-pill-btn ${selectedSemester === "all" ? "active" : ""}`}
                  onClick={() => setSelectedSemester("all")}
                >
                  All Semesters ({transcript.semesters.length})
                </button>
                {transcript.semesters.map((s) => (
                  <button
                    key={s.semesterNumber}
                    type="button"
                    className={`sem-pill-btn ${selectedSemester === String(s.semesterNumber) ? "active" : ""}`}
                    onClick={() => setSelectedSemester(String(s.semesterNumber))}
                  >
                    Semester {s.semesterNumber} (SGPA: {s.sgpa.toFixed(2)})
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => onOpenTranscript(currentStudent.id)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                Print Official Grade Sheet
              </button>
            </div>

            {/* Verification banner */}
            <div className="official-publish-banner">
              <div className="pub-badge-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>Verified Institutional Record &bull; Certified by Harvard SEAS Registrar</span>
              </div>
              <span className="pub-hash-right">
                Serial: HAR-SEAS-{currentStudent.id.replace(/-/g, "").slice(-6)}-VERIFIED
              </span>
            </div>

            {transcript.semesters.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                No semester results have been officially published yet for this student.
              </div>
            ) : (
              (selectedSemester === "all"
                ? transcript.semesters
                : transcript.semesters.filter((s) => s.semesterNumber === parseInt(selectedSemester))
              ).map((sem) => (
                <div key={sem.semesterNumber} style={{ marginBottom: "2.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", color: "var(--harvard-crimson-dark)", fontWeight: 700 }}>
                      Semester {sem.semesterNumber} &mdash; {sem.term}
                    </h4>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      Published Date: {sem.publishDate || "Officially Approved"}
                    </span>
                  </div>

                  <div className="data-table-wrapper">
                    <table className="academic-table">
                      <thead>
                        <tr>
                          <th style={{ width: "130px" }}>Course Code</th>
                          <th>Course Title</th>
                          <th style={{ width: "150px" }}>Discipline Area</th>
                          <th style={{ width: "80px", textAlign: "center" }}>Credits</th>
                          <th style={{ width: "80px", textAlign: "center" }}>Score</th>
                          <th style={{ width: "90px", textAlign: "center" }}>Letter Grade</th>
                          <th style={{ width: "90px", textAlign: "center" }}>Grade Point</th>
                          <th style={{ width: "100px", textAlign: "center" }}>Credit Points</th>
                          <th style={{ width: "90px", textAlign: "center" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sem.courses.map((c) => (
                          <tr key={c.courseCode}>
                            <td className="code-badge">{c.courseCode}</td>
                            <td>
                              <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{c.courseTitle}</div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.department}</div>
                            </td>
                            <td>
                              <span style={{ fontSize: "0.76rem", padding: "2px 8px", background: "var(--bg-page)", border: "1px solid var(--border-light)", borderRadius: "4px" }}>
                                {c.category}
                              </span>
                            </td>
                            <td style={{ textAlign: "center", fontFamily: "var(--font-mono)" }}>{c.credits.toFixed(1)}</td>
                            <td style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{c.marks}%</td>
                            <td style={{ textAlign: "center" }}>
                              <span className="grade-badge-pill" style={{ backgroundColor: c.letter.startsWith("A") ? "#A51C30" : "#C92A3E" }}>
                                {c.letter}
                              </span>
                            </td>
                            <td style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                              {c.point.toFixed(2)}
                            </td>
                            <td style={{ textAlign: "center", fontFamily: "var(--font-mono)" }}>
                              {c.creditPoints.toFixed(2)}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span style={{ fontSize: "0.76rem", fontWeight: 700, color: c.passed ? "#166534" : "#991B1B" }}>
                                {c.passed ? "PASSED" : "FAILED"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="sem-summary-strip">
                    <div className="metric-cell">
                      <span className="metric-cell-title">Registered Credits</span>
                      <span className="metric-cell-value">{sem.totalCredits.toFixed(1)} Cr</span>
                    </div>
                    <div className="metric-cell">
                      <span className="metric-cell-title">Earned Credits</span>
                      <span className="metric-cell-value">{sem.earnedCredits.toFixed(1)} Cr</span>
                    </div>
                    <div className="metric-cell">
                      <span className="metric-cell-title">Total Grade Points</span>
                      <span className="metric-cell-value">{sem.totalGradePoints.toFixed(2)}</span>
                    </div>
                    <div className="metric-cell">
                      <span className="metric-cell-title">Semester SGPA</span>
                      <span className="metric-cell-value crimson">{sem.sgpa.toFixed(2)}</span>
                    </div>
                    <div className="metric-cell">
                      <span className="metric-cell-title">Cumulative CGPA</span>
                      <span className="metric-cell-value">{sem.runningCgpa ? sem.runningCgpa.toFixed(2) : "-"}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Interactive What-If Simulator */}
          <div className="simulator-box">
            <div className="card-title-row">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--harvard-crimson)" strokeWidth="2">
                  <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                  <line x1="8" y1="6" x2="16" y2="6"></line>
                  <line x1="16" y1="14" x2="16" y2="18"></line>
                  <path d="M16 10h.01"></path>
                  <path d="M12 10h.01"></path>
                  <path d="M8 10h.01"></path>
                  <path d="M12 14h.01"></path>
                  <path d="M8 14h.01"></path>
                  <path d="M12 18h.01"></path>
                  <path d="M8 18h.01"></path>
                </svg>
                Interactive "What-If" GPA Forecaster
              </h3>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Forecast upcoming semester marks to project graduation honors
              </span>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Add hypothetical courses and anticipated percentage marks below to calculate your projected cumulative CGPA:
            </p>

            <div className="sim-two-col">
              <div>
                {simCourses.length === 0 ? (
                  <div style={{ padding: "1.25rem", background: "var(--bg-page)", border: "1px dashed var(--border-light)", borderRadius: "var(--radius-sm)", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    No simulation courses added yet. Click <strong>+ Add Course to Simulate</strong> below.
                  </div>
                ) : (
                  simCourses.map((item, idx) => (
                    <div key={idx} className="sim-input-row">
                      <input
                        type="text"
                        className="sim-form-input"
                        placeholder="Course Name"
                        value={item.name}
                        onChange={(e) => handleSimChange(idx, "name", e.target.value)}
                      />
                      <input
                        type="number"
                        className="sim-form-input"
                        placeholder="Credits"
                        value={item.credits}
                        step="0.5"
                        min="1"
                        max="12"
                        onChange={(e) => handleSimChange(idx, "credits", e.target.value)}
                      />
                      <input
                        type="number"
                        className="sim-form-input"
                        placeholder="Expected Marks (0-100)"
                        value={item.marks}
                        min="0"
                        max="100"
                        onChange={(e) => handleSimChange(idx, "marks", e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: "0.45rem 0.75rem", fontSize: "0.9rem" }}
                        onClick={() => handleSimRemoveCourse(idx)}
                      >
                        &times;
                      </button>
                    </div>
                  ))
                )}

                <div style={{ marginTop: "1rem" }}>
                  <button type="button" className="btn-secondary" onClick={handleSimAddCourse}>
                    + Add Course to Simulate
                  </button>
                </div>
              </div>

              {simulationResult && (
                <div className="sim-result-card">
                  <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--harvard-crimson-dark)", fontWeight: 800 }}>
                    Projected Graduation CGPA
                  </span>
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: "2.8rem", fontWeight: 900, color: "var(--harvard-crimson)", margin: "0.25rem 0" }}>
                    {simulationResult.projectedCgpa.toFixed(2)}
                  </span>
                  <div style={{ margin: "0.4rem 0" }}>
                    <span className={`honors-badge ${simulationResult.projectedClassification.badgeClass}`}>
                      {simulationResult.projectedClassification.title}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: simulationResult.delta >= 0 ? "#166534" : "#991B1B", fontFamily: "var(--font-mono)" }}>
                    {simulationResult.delta >= 0 ? `+${simulationResult.delta.toFixed(2)}` : simulationResult.delta.toFixed(2)} change ({simulationResult.simCredits} credits simulated)
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Profile Image Upload & Customization Modal */}
      {isAvatarModalOpen && currentStudent && (
        <ProfileImageModal
          student={currentStudent}
          onClose={() => setIsAvatarModalOpen(false)}
          onUpdated={() => {
            setIsAvatarModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// SVG Progression Line Graph
function renderProgressionSvg(semesters) {
  if (!semesters || semesters.length === 0) {
    return <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>No published data available.</div>;
  }

  const width = 620;
  const height = 180;
  const padding = { top: 25, right: 30, bottom: 35, left: 45 };
  const minGpa = 2.0;
  const maxGpa = 4.0;

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const getX = (idx) => padding.left + (idx / Math.max(1, semesters.length - 1)) * innerWidth;
  const getY = (val) => padding.top + innerHeight - ((val - minGpa) / (maxGpa - minGpa)) * innerHeight;

  const cgpaPoints = semesters.map((s, idx) => ({
    x: getX(idx),
    y: getY(s.runningCgpa || s.sgpa),
    val: s.runningCgpa || s.sgpa,
    sem: s.semesterNumber
  }));

  const sgpaPoints = semesters.map((s, idx) => ({
    x: getX(idx),
    y: getY(s.sgpa),
    val: s.sgpa,
    sem: s.semesterNumber
  }));

  const cgpaPath = cgpaPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const sgpaPath = sgpaPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "100%" }}>
      {/* Grid Lines */}
      {[2.0, 2.5, 3.0, 3.5, 4.0].map((val) => {
        const y = getY(val);
        return (
          <g key={val}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#E2E8F0" strokeDasharray="3,3" />
            <text x={padding.left - 8} y={y + 4} fill="#64748B" fontSize="10" fontFamily="'JetBrains Mono', monospace" textAnchor="end">
              {val.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* SGPA line (dashed) */}
      <path d={sgpaPath} fill="none" stroke="#2563EB" strokeWidth="2" strokeDasharray="4,4" />

      {/* CGPA line (Harvard Crimson) */}
      <path d={cgpaPath} fill="none" stroke="#A51C30" strokeWidth="3" />

      {/* Points */}
      {sgpaPoints.map((p) => (
        <circle key={`s-${p.sem}`} cx={p.x} cy={p.y} r="3.5" fill="#2563EB" />
      ))}

      {cgpaPoints.map((p) => (
        <g key={`c-${p.sem}`}>
          <circle cx={p.x} cy={p.y} r="5" fill="#A51C30" stroke="#FFFFFF" strokeWidth="2" />
          <text x={p.x} y={p.y - 10} fill="#111827" fontSize="10" fontWeight="700" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
            {p.val.toFixed(2)}
          </text>
          <text x={p.x} y={height - 10} fill="#64748B" fontSize="10" fontWeight="600" textAnchor="middle">
            Sem {p.sem}
          </text>
        </g>
      ))}

      {/* Legend */}
      <g transform={`translate(${width - 180}, 14)`}>
        <line x1="0" y1="0" x2="16" y2="0" stroke="#A51C30" strokeWidth="3" />
        <circle cx="8" cy="0" r="3" fill="#A51C30" />
        <text x="22" y="3" fill="#111827" fontSize="10" fontWeight="600">CGPA</text>

        <line x1="85" y1="0" x2="101" y2="0" stroke="#2563EB" strokeWidth="2" strokeDasharray="3,3" />
        <circle cx="93" cy="0" r="2.5" fill="#2563EB" />
        <text x="107" y="3" fill="#64748B" fontSize="10">SGPA</text>
      </g>
    </svg>
  );
}
