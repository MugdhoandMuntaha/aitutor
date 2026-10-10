import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export function AuthModal({ isOpen, onClose, defaultRole = "student", onShowToast }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("signin"); // 'signin' or 'signup'
  const [role, setRole] = useState(defaultRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [adminPasscode, setAdminPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (mode === "signin") {
        await signIn(email, password);
        onShowToast?.(`Signed in successfully as ${role === "admin" ? "Registrar Admin" : "Student"}.`, "success");
        onClose();
      } else {
        // Validation for admin signup
        if (role === "admin" && adminPasscode.trim() !== "HARVARD_SEAS" && adminPasscode.trim() !== "admin123") {
          throw new Error("Invalid Administrator Authorization Passcode. (Try HARVARD_SEAS or admin123)");
        }
        if (role === "student" && !studentId.trim()) {
          throw new Error("Student ID number is required for undergraduate enrollment.");
        }

        await signUp(email, password, {
          role,
          studentId: role === "student" ? studentId.trim() : null,
          fullName: fullName.trim()
        });

        onShowToast?.("Account registered successfully!", "success");
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  // Quick fill demo helper
  const handleQuickFill = (targetRole) => {
    if (targetRole === "admin") {
      setRole("admin");
      setEmail("admin@seas.harvard.edu");
      setPassword("admin123");
      setAdminPasscode("HARVARD_SEAS");
      setFullName("Dean of Academic Affairs");
    } else {
      setRole("student");
      setEmail("student@college.harvard.edu");
      setPassword("student123");
      setStudentId("HAR-CS-2025-001");
      setFullName("Registered CSE Student");
    }
    setErrorMsg("");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="transcript-modal-container" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-top-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.75rem", background: "var(--harvard-crimson)", color: "#FFFFFF" }}>
          <div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", fontWeight: 800 }}>
              Harvard SEAS &bull; Authentication
            </h3>
            <p style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.9)" }}>
              {mode === "signin" ? "Sign in to access official records" : "Create authenticated academic profile"}
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", color: "#FFFFFF", fontSize: "1.4rem", cursor: "pointer" }}>
            &times;
          </button>
        </div>

        <div style={{ padding: "1.75rem" }}>
          {/* Sign In vs Register Switcher */}
          <div style={{ display: "flex", background: "var(--bg-page)", borderRadius: "var(--radius-md)", padding: "4px", marginBottom: "1.5rem", border: "1px solid var(--border-light)" }}>
            <button
              type="button"
              className={`role-tab-btn ${mode === "signin" ? "active" : ""}`}
              style={{ flex: 1, justifyContent: "center", color: mode === "signin" ? "var(--harvard-crimson)" : "var(--text-secondary)" }}
              onClick={() => { setMode("signin"); setErrorMsg(""); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`role-tab-btn ${mode === "signup" ? "active" : ""}`}
              style={{ flex: 1, justifyContent: "center", color: mode === "signup" ? "var(--harvard-crimson)" : "var(--text-secondary)" }}
              onClick={() => { setMode("signup"); setErrorMsg(""); }}
            >
              Register / Enroll
            </button>
          </div>

          {/* Role selector */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
              Academic Role:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <button
                type="button"
                className={`sem-pill-btn ${role === "student" ? "active" : ""}`}
                style={{ textAlign: "center", padding: "0.6rem" }}
                onClick={() => setRole("student")}
              >
                Undergraduate Student
              </button>
              <button
                type="button"
                className={`sem-pill-btn ${role === "admin" ? "active" : ""}`}
                style={{ textAlign: "center", padding: "0.6rem" }}
                onClick={() => setRole("admin")}
              >
                Registrar Admin
              </button>
            </div>
          </div>

          {errorMsg && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", padding: "0.75rem", borderRadius: "var(--radius-sm)", fontSize: "0.82rem", marginBottom: "1.25rem", fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Full Name:
                </label>
                <input
                  type="text"
                  className="search-input-box"
                  style={{ width: "100%", background: "#FFFFFF" }}
                  placeholder="e.g. Alexander J. Hayes"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            {mode === "signup" && role === "student" && (
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Official Student ID:
                </label>
                <input
                  type="text"
                  className="search-input-box"
                  style={{ width: "100%", background: "#FFFFFF" }}
                  placeholder="e.g. HAR-CS-2025-001"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                />
              </div>
            )}

            {mode === "signup" && role === "admin" && (
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Administrator Passkey:
                </label>
                <input
                  type="password"
                  className="search-input-box"
                  style={{ width: "100%", background: "#FFFFFF" }}
                  placeholder="Enter SEAS Admin Passkey (HARVARD_SEAS)"
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  required
                />
              </div>
            )}

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                Email Address:
              </label>
              <input
                type="email"
                className="search-input-box"
                style={{ width: "100%", background: "#FFFFFF" }}
                placeholder={role === "admin" ? "admin@seas.harvard.edu" : "student@college.harvard.edu"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                Password:
              </label>
              <input
                type="password"
                className="search-input-box"
                style={{ width: "100%", background: "#FFFFFF" }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-harvard"
              style={{ width: "100%", padding: "0.75rem", fontSize: "0.92rem", marginBottom: "1rem" }}
              disabled={loading}
            >
              {loading ? "Authenticating..." : mode === "signin" ? "Sign In to Portal" : "Complete Registration"}
            </button>
          </form>

          {/* Quick-fill helper for instant testing */}
          <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "1rem", marginTop: "1rem", textAlign: "center" }}>
            <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", fontWeight: 700 }}>
              Quick Credentials:
            </span>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "0.5rem" }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                onClick={() => handleQuickFill("student")}
              >
                Use Student Account
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                onClick={() => handleQuickFill("admin")}
              >
                Use Admin Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
