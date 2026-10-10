import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { dataStore } from "../services/dataStore";
import { supabaseService } from "../services/supabaseService";
import { isSupabaseConfigured } from "../lib/supabase";

export function AuthPage({
  onSelectStudentView,
  onSelectAdminView,
  onOpenCurriculum,
  onOpenDbConfig,
  onShowToast
}) {
  const { user, profile, isAdmin, isStudent, isAuthenticated, signIn, signUp, signOut } = useAuth();
  const isConnected = isSupabaseConfigured();

  // Student portal states
  const [studentIdInput, setStudentIdInput] = useState("");
  const [showStudentLogin, setShowStudentLogin] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentFullName, setStudentFullName] = useState("");
  const [studentRegMode, setStudentRegMode] = useState("signin"); // 'signin' | 'signup'
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState("");

  // Pre-load data from Supabase on mount
  useEffect(() => {
    if (supabaseService.isReady()) {
      supabaseService.getStudents().catch((err) => console.warn("AuthPage sync error:", err));
    }
  }, []);

  // Admin portal states
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasscode, setAdminPasscode] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  // Handler: Enter student view by quick ID lookup
  const handleStudentQuickAccess = async (e) => {
    e.preventDefault();
    const query = studentIdInput.trim();
    if (query) {
      setStudentLoading(true);
      let match = dataStore.getStudentById(query);
      if (!match && supabaseService.isReady()) {
        try {
          await supabaseService.getStudents();
          match = dataStore.getStudentById(query);
        } catch (err) {
          console.warn("Supabase lookup error:", err);
        }
      }
      setStudentLoading(false);

      if (match) {
        onSelectStudentView(match.id);
        onShowToast?.(`Loaded official transcript for Student ID: ${match.id}`, "success");
      } else {
        // Still allow entering student view with the query so student view can show lookup message
        onSelectStudentView(query);
      }
    } else {
      // Just enter student view directly
      onSelectStudentView();
    }
  };

  // Handler: Student authentication
  const handleStudentAuth = async (e) => {
    e.preventDefault();
    setStudentError("");
    setStudentLoading(true);

    try {
      if (studentRegMode === "signin") {
        await signIn(studentEmail, studentPassword);
        onShowToast?.("Signed in successfully as Undergraduate Student.", "success");
        onSelectStudentView();
      } else {
        if (!studentIdInput.trim()) {
          throw new Error("Student ID is required for registration (e.g. HAR-CS-2025-001).");
        }
        await signUp(studentEmail, studentPassword, {
          role: "student",
          studentId: studentIdInput.trim(),
          fullName: studentFullName.trim()
        });
        onShowToast?.("Student account registered successfully!", "success");
        onSelectStudentView(studentIdInput.trim());
      }
    } catch (err) {
      setStudentError(err.message || "Authentication failed.");
    } finally {
      setStudentLoading(false);
    }
  };

  // Handler: Admin authentication
  const handleAdminAuth = async (e) => {
    e.preventDefault();
    setAdminError("");
    setAdminLoading(true);

    try {
      if (!adminEmail.trim() || !adminPassword) {
        throw new Error("Please enter your Registrar Admin staff email and password.");
      }

      const passcode = adminPasscode.trim();
      if (passcode !== "HARVARD_SEAS" && passcode !== "admin123") {
        throw new Error("Invalid Administrative Authorization Passcode. (Hint: Use HARVARD_SEAS or admin123)");
      }

      await signIn(adminEmail, adminPassword);
      onShowToast?.("Authenticated as Registrar Administrator.", "success");
      onSelectAdminView();
    } catch (err) {
      setAdminError(err.message || "Admin authentication failed.");
    } finally {
      setAdminLoading(false);
    }
  };

  // Quick fill helper for testing
  const handleQuickFillAdmin = () => {
    setAdminEmail("admin@seas.harvard.edu");
    setAdminPassword("admin123");
    setAdminPasscode("HARVARD_SEAS");
    setAdminError("");
  };

  const handleQuickFillStudent = () => {
    setStudentIdInput("HAR-CS-2025-001");
  };

  return (
    <div className="auth-gateway-page">
      {/* Hero Veritas Header */}
      <header className="auth-hero-banner">
        <div className="auth-hero-content">
          <img
            src="/harvard-logo.png"
            alt="Harvard University Veritas Crest"
            className="auth-hero-logo"
          />
          <div className="auth-hero-text">
            <span className="auth-institution-tag">ACADEMIC RECORDS &amp; RESULT PUBLICATION PORTAL</span>
            <h1 className="auth-hero-title">HARVARD UNIVERSITY</h1>
            <p className="auth-hero-subtitle">
              John A. Paulson School of Engineering and Applied Sciences &bull; Department of Computer Science
            </p>
            <div className="auth-badge-pills">
              <span className="auth-pill">B.Sc. in Computer Science &amp; Engineering</span>
              <span className="auth-pill">Official Grading System (4.00 Scale)</span>
              <span className="auth-pill">Veritas 1636</span>
              <button
                type="button"
                className="auth-pill"
                onClick={onOpenCurriculum}
                style={{ cursor: "pointer", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.35)", color: "#FFFFFF" }}
              >
                Harvard CS Syllabus
              </button>
              {isAuthenticated && (
                <button
                  type="button"
                  className="auth-pill"
                  onClick={signOut}
                  style={{ cursor: "pointer", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.25)", color: "#FFFFFF" }}
                >
                  Sign Out ({isAdmin ? "Admin" : "Student"})
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Dual Portal Gateway */}
      <main className="auth-portal-container">
        <div className="auth-portal-intro">
          <h2>Select Portal Access</h2>
          <p>
            Choose your academic role below. Students can look up published semester transcripts and grade sheets,
            while Registrar Officers can authenticate to access the examination and results control system.
          </p>
        </div>

        <div className="auth-portal-grid">
          {/* ==============================================================
              PORTAL 1: STUDENT VIEW (UNDERGRADUATE ACADEMIC RECORDS)
             ============================================================== */}
          <div className="auth-portal-card student-card">
            <div className="auth-card-header">
              <div className="auth-card-badge student-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                </svg>
                UNDERGRADUATE STUDENT PORTAL
              </div>
              <h3 className="auth-card-title">Student View</h3>
              <p className="auth-card-desc">
                Access published semester results, cumulative grade point averages (CGPA), credit progress,
                and official Harvard transcripts.
              </p>
            </div>

            <div className="auth-card-body">
              {/* Quick ID Lookup Box */}
              <div className="auth-quick-lookup-box">
                <label className="auth-field-label">
                  Instant Record Lookup by Student ID:
                </label>
                <form onSubmit={handleStudentQuickAccess} className="auth-search-form">
                  <div className="auth-input-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="auth-input-icon">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                      type="text"
                      className="auth-input-field"
                      placeholder="e.g. HAR-CS-2025-001"
                      value={studentIdInput}
                      onChange={(e) => setStudentIdInput(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-harvard-full">
                    Enter Student View &rarr;
                  </button>
                </form>

                <div className="auth-demo-hint">
                  <span>Demo Record:</span>
                  <button type="button" className="btn-link-demo" onClick={handleQuickFillStudent}>
                    Auto-fill HAR-CS-2025-001
                  </button>
                </div>
              </div>

              {/* Direct Open Student View Button */}
              <div style={{ textAlign: "center", margin: "1.25rem 0", position: "relative" }}>
                <div style={{ borderBottom: "1px solid var(--border-light)", margin: "0.75rem 0" }}></div>
                <span style={{ position: "relative", top: "-10px", background: "#FFFFFF", padding: "0 10px", fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  OR
                </span>
                <button
                  type="button"
                  className="btn-outline-student"
                  onClick={() => onSelectStudentView()}
                >
                  Browse Student Portal Without ID &rarr;
                </button>
              </div>

              {/* Optional Student Account Sign-In / Register Toggle */}
              <div className="auth-toggle-section">
                <button
                  type="button"
                  className="auth-toggle-btn"
                  onClick={() => setShowStudentLogin(!showStudentLogin)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showStudentLogin ? (
                      <polyline points="18 15 12 9 6 15"></polyline>
                    ) : (
                      <polyline points="6 9 12 15 18 9"></polyline>
                    )}
                  </svg>
                  {showStudentLogin ? "Hide Student Account Login" : "Registered Student Account Login (Optional)"}
                </button>

                {showStudentLogin && (
                  <form onSubmit={handleStudentAuth} className="auth-nested-form">
                    <div className="auth-subtabs">
                      <button
                        type="button"
                        className={`auth-subtab-btn ${studentRegMode === "signin" ? "active" : ""}`}
                        onClick={() => setStudentRegMode("signin")}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        className={`auth-subtab-btn ${studentRegMode === "signup" ? "active" : ""}`}
                        onClick={() => setStudentRegMode("signup")}
                      >
                        Register Account
                      </button>
                    </div>

                    {studentError && <div className="auth-error-banner">{studentError}</div>}

                    {studentRegMode === "signup" && (
                      <div className="auth-field-group">
                        <label className="auth-field-label">Full Name:</label>
                        <input
                          type="text"
                          className="auth-input-field"
                          placeholder="e.g. John Harvard"
                          value={studentFullName}
                          onChange={(e) => setStudentFullName(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    <div className="auth-field-group">
                      <label className="auth-field-label">Student Email:</label>
                      <input
                        type="email"
                        className="auth-input-field"
                        placeholder="student@college.harvard.edu"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="auth-field-group">
                      <label className="auth-field-label">Password:</label>
                      <input
                        type="password"
                        className="auth-input-field"
                        placeholder="••••••••"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        required
                      />
                    </div>

                    <button type="submit" className="btn-harvard-full" disabled={studentLoading}>
                      {studentLoading
                        ? "Verifying..."
                        : studentRegMode === "signin"
                        ? "Sign In to Student Account"
                        : "Complete Student Registration"}
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="auth-card-footer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#059669" }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>Public Student Verification &bull; Certified by Harvard SEAS Registrar</span>
            </div>
          </div>

          {/* ==============================================================
              PORTAL 2: REGISTRAR ADMIN PANEL (RESTRICTED ACCESS)
             ============================================================== */}
          <div className="auth-portal-card admin-card">
            <div className="auth-card-header">
              <div className="auth-card-badge admin-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                RESTRICTED REGISTRAR ACCESS
              </div>
              <h3 className="auth-card-title">Admin View</h3>
              <p className="auth-card-desc">
                Restricted to authorized Harvard SEAS Registrar &amp; Examination Committee officers for
                grade entry, result publication, curriculum auditing, and student enrollment.
              </p>
            </div>

            <div className="auth-card-body">
              {isAuthenticated && isAdmin ? (
                /* Already Authenticated as Admin */
                <div className="auth-admin-active-box">
                  <div className="auth-active-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--harvard-crimson)" }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "3px" }}>
                      Authorized Admin Session Active
                    </h4>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      Logged in as: <strong>{profile?.full_name || user?.email}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-harvard-full"
                    style={{ marginTop: "1rem" }}
                    onClick={onSelectAdminView}
                  >
                    Enter Registrar Admin Panel &rarr;
                  </button>
                  <button
                    type="button"
                    className="btn-outline-student"
                    style={{ marginTop: "0.5rem" }}
                    onClick={signOut}
                  >
                    Sign Out Administrator
                  </button>
                </div>
              ) : (
                /* Admin Login Form */
                <form onSubmit={handleAdminAuth} className="auth-admin-form">
                  {adminError && <div className="auth-error-banner">{adminError}</div>}

                  <div className="auth-field-group">
                    <label className="auth-field-label">Registrar Staff Email:</label>
                    <div className="auth-input-wrapper">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="auth-input-icon">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      <input
                        type="email"
                        className="auth-input-field"
                        placeholder="admin@seas.harvard.edu"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-field-group">
                    <label className="auth-field-label">Staff Password:</label>
                    <div className="auth-input-wrapper">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="auth-input-icon">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      <input
                        type="password"
                        className="auth-input-field"
                        placeholder="••••••••"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-field-group">
                    <label className="auth-field-label">
                      Admin Authorization Passcode:
                    </label>
                    <div className="auth-input-wrapper">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="auth-input-icon">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                      <input
                        type="password"
                        className="auth-input-field"
                        placeholder="Authorization Passcode (HARVARD_SEAS)"
                        value={adminPasscode}
                        onChange={(e) => setAdminPasscode(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-admin-submit"
                    disabled={adminLoading}
                  >
                    {adminLoading ? "Authenticating Registrar..." : "Sign In as Registrar Admin \u2192"}
                  </button>

                  {/* One click demo fill */}
                  <div className="auth-demo-hint" style={{ marginTop: "0.85rem" }}>
                    <span>For quick evaluation:</span>
                    <button
                      type="button"
                      className="btn-link-demo"
                      onClick={handleQuickFillAdmin}
                    >
                      Fill Admin Demo Credentials
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="auth-card-footer admin-footer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--harvard-crimson)" }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>Authorized Personnel Only &bull; Secured with Supabase Cloud Auth</span>
            </div>
          </div>
        </div>

        {/* Informative Footer Banner */}
        <div className="auth-academic-banner">
          <div className="auth-banner-item">
            <strong>Degree Program</strong>
            <span>Bachelor of Science in Computer Science &amp; Engineering</span>
          </div>
          <div className="auth-banner-item">
            <strong>Harvard SEAS Curriculum</strong>
            <span>CS50, CS51, CS121, CS124, CS161, CS181 &amp; Advanced Electives</span>
          </div>
          <div className="auth-banner-item">
            <strong>Academic Integrity</strong>
            <span>Harvard College Honor Code &bull; Veritas 1636</span>
          </div>
        </div>
      </main>
    </div>
  );
}
