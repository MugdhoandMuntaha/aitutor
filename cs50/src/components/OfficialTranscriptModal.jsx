import React from "react";
import { dataStore } from "../services/dataStore";
import { calculateStudentTranscript } from "../services/academicCalculator";

export function OfficialTranscriptModal({ studentId, onClose }) {
  if (!studentId) return null;

  const student = dataStore.getStudentById(studentId);
  if (!student) return null;

  const transcript = calculateStudentTranscript(student, true);
  const gradingScale = dataStore.getGradingScale();
  const currentDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const serialNumber = `HAR-SEAS-TR-${student.id.replace(/-/g, "").slice(-6)}-${new Date().getFullYear()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="transcript-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Web Top bar (hidden in print) */}
        <div className="modal-top-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.75rem", background: "#111827", color: "#FFFFFF" }}>
          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Official Academic Transcript Preview</span>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button type="button" className="btn-harvard" style={{ padding: "0.4rem 0.9rem", fontSize: "0.8rem" }} onClick={handlePrint}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print / Save as PDF
            </button>
            <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", color: "#9CA3AF", fontSize: "1.4rem", cursor: "pointer" }}>
              &times;
            </button>
          </div>
        </div>

        {/* Printable Transcript Document Paper */}
        <div className="transcript-paper-document">
          {/* Official Harvard Seal Header */}
          <div className="transcript-uni-header">
            <img
              src="/harvard-logo.png"
              alt="Harvard Veritas Seal"
              className="transcript-crest-logo"
              style={{ objectFit: "contain", width: "72px", height: "72px", margin: "0 auto 0.5rem", display: "block" }}
            />
            <div className="t-school-name">HARVARD UNIVERSITY</div>
            <div className="t-division-name">JOHN A. PAULSON SCHOOL OF ENGINEERING AND APPLIED SCIENCES</div>
            <div className="t-title-tag">OFFICIAL UNDERGRADUATE ACADEMIC TRANSCRIPT & RECORD OF STUDY</div>
          </div>

          {/* Student Information Grid */}
          <div className="t-data-grid">
            <div>
              <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: 700, width: "140px", display: "inline-block" }}>STUDENT NAME:</span> <strong>{student.name.toUpperCase()}</strong></div>
              <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: 700, width: "140px", display: "inline-block" }}>STUDENT ID:</span> <strong>{student.id}</strong></div>
              <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: 700, width: "140px", display: "inline-block" }}>DEGREE PROGRAM:</span> <strong>B.Sc. in Computer Science & Engineering</strong></div>
              <div><span style={{ fontWeight: 700, width: "140px", display: "inline-block" }}>CONCENTRATION:</span> {student.concentration}</div>
            </div>
            <div>
              <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: 700, width: "140px", display: "inline-block" }}>DATE OF ISSUE:</span> {currentDate}</div>
              <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: 700, width: "140px", display: "inline-block" }}>ACADEMIC COHORT:</span> {student.batch}</div>
              <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: 700, width: "140px", display: "inline-block" }}>FACULTY ADVISOR:</span> {student.advisor}</div>
              <div><span style={{ fontWeight: 700, width: "140px", display: "inline-block" }}>SERIAL RECORD:</span> {serialNumber}</div>
            </div>
            {student.avatar && (
              <div style={{ textAlign: "center" }}>
                <div style={{ width: "72px", height: "88px", border: "1.5px solid #0F172A", padding: "2px", background: "#FFFFFF", borderRadius: "3px", overflow: "hidden", margin: "0 auto" }}>
                  <img
                    src={student.avatar}
                    alt={student.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=A51C30&color=fff`;
                    }}
                  />
                </div>
                <span style={{ fontSize: "7px", fontWeight: 800, color: "#64748B", display: "block", marginTop: "2px", letterSpacing: "0.5px" }}>STUDENT PHOTO</span>
              </div>
            )}
          </div>

          {/* Semesters Courses progression */}
          {transcript.semesters.map((sem) => (
            <div key={sem.semesterNumber} style={{ marginBottom: "1.5rem", pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.86rem", borderBottom: "1.5px solid #1E293B", paddingBottom: "3px", marginBottom: "4px" }}>
                <span>SEMESTER {sem.semesterNumber} &mdash; {sem.term.toUpperCase()}</span>
                <span>TERM SGPA: {sem.sgpa.toFixed(2)} | RUNNING CGPA: {sem.runningCgpa.toFixed(2)}</span>
              </div>
              <table className="t-term-table">
                <thead>
                  <tr>
                    <th style={{ width: "95px" }}>COURSE CODE</th>
                    <th>COURSE TITLE</th>
                    <th style={{ width: "60px", textAlign: "center" }}>CREDITS</th>
                    <th style={{ width: "60px", textAlign: "center" }}>MARKS</th>
                    <th style={{ width: "65px", textAlign: "center" }}>GRADE</th>
                    <th style={{ width: "60px", textAlign: "center" }}>POINTS</th>
                    <th style={{ width: "70px", textAlign: "right" }}>WEIGHTED</th>
                  </tr>
                </thead>
                <tbody>
                  {sem.courses.map((c) => (
                    <tr key={c.courseCode}>
                      <td style={{ fontWeight: 700 }}>{c.courseCode}</td>
                      <td>{c.courseTitle}</td>
                      <td style={{ textAlign: "center" }}>{c.credits.toFixed(1)}</td>
                      <td style={{ textAlign: "center" }}>{c.marks}%</td>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>{c.letter}</td>
                      <td style={{ textAlign: "center" }}>{c.point.toFixed(2)}</td>
                      <td style={{ textAlign: "right" }}>{c.creditPoints.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* Degree Cumulative Box */}
          <div style={{ border: "2px solid #111827", padding: "1rem 1.25rem", margin: "1.5rem 0", background: "#F8FAFC", pageBreakInside: "avoid" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", textAlign: "center", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#475569", fontWeight: 700 }}>TOTAL CREDITS ATTEMPTED</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>{transcript.totalRegisteredCredits.toFixed(1)}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#475569", fontWeight: 700 }}>TOTAL CREDITS EARNED</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>{transcript.totalEarnedCredits.toFixed(1)}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#475569", fontWeight: 700 }}>CUMULATIVE CGPA</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--harvard-crimson)" }}>{transcript.cgpa.toFixed(2)} / 4.00</div>
              </div>
              <div>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#475569", fontWeight: 700 }}>ACADEMIC HONORS</div>
                <div style={{ fontSize: "0.92rem", fontWeight: 800, marginTop: "4px", color: "#111827" }}>
                  {transcript.classification.title}
                </div>
              </div>
            </div>
          </div>

          {/* Grading Scale Legend */}
          <div style={{ fontSize: "0.72rem", color: "#64748B", borderTop: "1px solid #CBD5E1", paddingTop: "0.75rem", marginBottom: "2rem" }}>
            <strong>GRADING KEY (4.0 SCALE):</strong>{" "}
            {gradingScale.slice(0, 8).map((s) => `${s.letter}=${s.point.toFixed(2)} (${s.minMarks}-${s.maxMarks}%)`).join(" | ")}
          </div>

          {/* Signatures & QR Seal */}
          <div className="transcript-signatures-box">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {/* QR Verification Code */}
              <svg style={{ width: "65px", height: "65px", border: "1px solid #CBD5E1", padding: "4px" }} viewBox="0 0 100 100">
                <rect width="100" height="100" fill="#FFFFFF" />
                <rect x="10" y="10" width="25" height="25" fill="#000000" />
                <rect x="15" y="15" width="15" height="15" fill="#FFFFFF" />
                <rect x="18" y="18" width="9" height="9" fill="#000000" />
                <rect x="65" y="10" width="25" height="25" fill="#000000" />
                <rect x="70" y="15" width="15" height="15" fill="#FFFFFF" />
                <rect x="73" y="18" width="9" height="9" fill="#000000" />
                <rect x="10" y="65" width="25" height="25" fill="#000000" />
                <rect x="15" y="70" width="15" height="15" fill="#FFFFFF" />
                <rect x="18" y="73" width="9" height="9" fill="#000000" />
                <rect x="45" y="15" width="10" height="10" fill="#000000" />
                <rect x="45" y="40" width="15" height="10" fill="#000000" />
                <rect x="65" y="65" width="25" height="25" fill="#000000" />
              </svg>
              <div style={{ fontSize: "0.72rem", color: "#475569", lineHeight: 1.4 }}>
                <div><strong>DIGITALLY VERIFIED</strong></div>
                <div>Hash: {serialNumber}</div>
                <div>Harvard University FAS Registrar</div>
              </div>
            </div>

            <div style={{ textAlign: "center", width: "220px", borderTop: "1.5px solid #111827", paddingTop: "6px", fontSize: "0.82rem" }}>
              <div style={{ fontFamily: "'Brush Script MT', cursive", fontSize: "1.4rem", color: "#1E293B", marginBottom: "2px" }}>
                C. Frank Stephenson
              </div>
              <strong>University Registrar</strong><br />
              <span>Harvard Faculty of Arts and Sciences & SEAS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
