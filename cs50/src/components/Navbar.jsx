import React from "react";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";

export function Navbar({
  viewMode,
  onExitToGateway,
  onOpenCurriculum,
  onOpenDbConfig
}) {
  const { user, profile, isAdmin, isStudent, isAuthenticated, signOut } = useAuth();
  const isConnected = isSupabaseConfigured();

  const handleSignOut = async () => {
    await signOut();
    onExitToGateway();
  };

  return (
    <header>
      {/* Main Navbar */}
      <div className="site-navbar">
        <div className="nav-container">
          <div className="brand-section" onClick={onExitToGateway} role="button" tabIndex={0} title="Return to Portal Gateway">
            {/* Harvard Veritas Seal Crest */}
            <img
              src="/harvard-logo.png"
              alt="Harvard University Veritas Crest"
              className="harvard-shield-crest"
              style={{ objectFit: "contain", width: "46px", height: "46px", borderRadius: "4px", background: "#FFFFFF", padding: "2px" }}
            />

            <div className="brand-titles">
              <h1>HARVARD UNIVERSITY</h1>
              <p>
                {viewMode === "admin"
                  ? "Office of the Registrar \u2022 Examination & Result Management"
                  : "B.Sc. in Computer Science & Engineering \u2022 Student Result Portal"}
              </p>
            </div>
          </div>

          <div className="nav-controls">
            {/* In Admin View: Display Admin Status Badge */}
            {viewMode === "admin" && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(0,0,0,0.25)",
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#FDE68A",
                  border: "1px solid rgba(253, 230, 138, 0.3)"
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                REGISTRAR ADMIN
              </div>
            )}

            {/* Authenticated user badge */}
            {isAuthenticated && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
                  {profile?.full_name || user?.email}
                </span>
                <button
                  type="button"
                  className="btn-nav-outline"
                  onClick={handleSignOut}
                  style={{ background: "rgba(0,0,0,0.25)", fontSize: "0.72rem", padding: "4px 8px" }}
                >
                  Sign Out
                </button>
              </div>
            )}

            {/* Harvard CS Syllabus Modal Trigger */}
            <button type="button" className="btn-nav-outline" onClick={onOpenCurriculum}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
              Harvard CS Syllabus
            </button>

            {/* Navigation back to Gateway */}
            <button
              type="button"
              className="btn-nav-outline"
              onClick={onExitToGateway}
              style={{ background: "rgba(255, 255, 255, 0.18)" }}
              title="Return to Portal Gateway Page"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"></path>
              </svg>
              {viewMode === "admin" ? "Exit Admin" : "Portal Gateway"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
