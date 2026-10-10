import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { AuthPage } from "./components/AuthPage";
import { StudentView } from "./components/StudentView";
import { AdminView } from "./components/AdminView";
import { OfficialTranscriptModal } from "./components/OfficialTranscriptModal";
import { CurriculumModal } from "./components/CurriculumModal";
import { NewStudentModal } from "./components/NewStudentModal";
import { AuthModal } from "./components/AuthModal";
import { SupabaseConfigModal } from "./components/SupabaseConfigModal";
import { dataStore } from "./services/dataStore";
import { supabaseService } from "./services/supabaseService";
import { useAuth } from "./context/AuthContext";

export function App() {
  const { user, profile, isAdmin, isStudent } = useAuth();
  
  // Navigation State: 'auth' (Portal Gateway) | 'student' (Student View) | 'admin' (Admin View)
  const [viewMode, setViewMode] = useState("auth");
  const [currentStudentId, setCurrentStudentId] = useState("");
  const [transcriptModalStudentId, setTranscriptModalStudentId] = useState(null);
  const [isCurriculumOpen, setIsCurriculumOpen] = useState(false);
  const [isNewStudentOpen, setIsNewStudentOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authDefaultRole, setAuthDefaultRole] = useState("student");
  const [isDbConfigOpen, setIsDbConfigOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [, setVersion] = useState(0);

  // Subscribe to reactive data store changes
  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  // Sync from Supabase database on app mount
  useEffect(() => {
    async function initRemoteSync() {
      if (supabaseService.isReady()) {
        try {
          await supabaseService.getStudents();
        } catch (err) {
          console.warn("Initial Supabase data sync error:", err);
        }
      }
    }
    initRemoteSync();
  }, []);

  // When a student logs in, automatically select their student ID
  useEffect(() => {
    if (isStudent && profile?.student_id) {
      setCurrentStudentId(profile.student_id);
    }
  }, [isStudent, profile]);

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const handleOpenAuth = (role = "student") => {
    setAuthDefaultRole(role);
    setIsAuthOpen(true);
  };

  const handleExitToGateway = () => {
    setViewMode("auth");
  };

  return (
    <div className="portal-app">
      {/* 1. AUTH GATEWAY VIEW: Landing Page with Student View & Admin View Portals */}
      {viewMode === "auth" && (
        <AuthPage
          onSelectStudentView={(studentId) => {
            if (studentId) setCurrentStudentId(studentId);
            setViewMode("student");
          }}
          onSelectAdminView={() => {
            setViewMode("admin");
          }}
          onOpenCurriculum={() => setIsCurriculumOpen(true)}
          onOpenDbConfig={() => setIsDbConfigOpen(true)}
          onShowToast={showToast}
        />
      )}

      {/* 2. STUDENT VIEW: Pure Student Academic Portal (NO ADMIN ACCESS OR BUTTONS) */}
      {viewMode === "student" && (
        <>
          <Navbar
            viewMode="student"
            onExitToGateway={handleExitToGateway}
            onOpenCurriculum={() => setIsCurriculumOpen(true)}
            onOpenDbConfig={() => setIsDbConfigOpen(true)}
          />
          <main className="main-content-shell">
            <StudentView
              currentStudentId={currentStudentId}
              setCurrentStudentId={setCurrentStudentId}
              onOpenTranscript={(id) => setTranscriptModalStudentId(id)}
            />
          </main>
        </>
      )}

      {/* 3. ADMIN VIEW: Restricted Registrar & Exam Control Panel */}
      {viewMode === "admin" && (
        <>
          <Navbar
            viewMode="admin"
            onExitToGateway={handleExitToGateway}
            onOpenCurriculum={() => setIsCurriculumOpen(true)}
            onOpenDbConfig={() => setIsDbConfigOpen(true)}
          />
          <main className="main-content-shell">
            {isAdmin ? (
              <AdminView
                onOpenNewStudent={() => setIsNewStudentOpen(true)}
                onOpenCurriculum={() => setIsCurriculumOpen(true)}
                onOpenAuth={handleOpenAuth}
                onShowToast={showToast}
              />
            ) : (
              <div className="univ-card" style={{ textAlign: "center", padding: "4rem 2rem", maxWidth: "600px", margin: "3rem auto" }}>
                <svg style={{ width: "56px", height: "56px", margin: "0 auto 1.25rem", color: "var(--harvard-crimson)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.35rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                  Registrar Access Restricted
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.75rem", lineHeight: 1.6 }}>
                  You must authenticate through the official Registrar Gateway with authorized staff credentials to access the examination panel.
                </p>
                <button
                  type="button"
                  className="btn-harvard"
                  onClick={handleExitToGateway}
                >
                  Return to Portal Gateway
                </button>
              </div>
            )}
          </main>
        </>
      )}

      {/* Official Modals */}
      {transcriptModalStudentId && (
        <OfficialTranscriptModal
          studentId={transcriptModalStudentId}
          onClose={() => setTranscriptModalStudentId(null)}
        />
      )}

      {isCurriculumOpen && (
        <CurriculumModal onClose={() => setIsCurriculumOpen(false)} />
      )}

      {isNewStudentOpen && (
        <NewStudentModal
          onClose={() => setIsNewStudentOpen(false)}
          onCreated={async (newId) => {
            setCurrentStudentId(newId);
            showToast(`Student enrolled! Registered in system.`, "success");
            if (supabaseService.isReady()) {
              await supabaseService.getStudents();
            }
          }}
        />
      )}

      {/* Auth Modal (if triggered directly) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultRole={authDefaultRole}
        onShowToast={showToast}
      />

      {/* Supabase Connection Setup Modal */}
      <SupabaseConfigModal
        isOpen={isDbConfigOpen}
        onClose={() => setIsDbConfigOpen(false)}
        onShowToast={showToast}
        onConfigUpdated={() => setVersion((v) => v + 1)}
      />

      {/* Toast Alert System */}
      <div id="toast-container" style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "8px" }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: "#FFFFFF",
              border: `1.5px solid ${t.type === "success" ? "#166534" : t.type === "error" ? "#DC2626" : "var(--harvard-crimson)"}`,
              borderLeft: `5px solid ${t.type === "success" ? "#166534" : t.type === "error" ? "#DC2626" : "var(--harvard-crimson)"}`,
              padding: "0.85rem 1.25rem",
              borderRadius: "8px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
              fontSize: "0.85rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              minWidth: "280px"
            }}
          >
            <span style={{ color: t.type === "success" ? "#166534" : "var(--harvard-crimson)" }}>
              {t.type === "success" ? "✓" : "ℹ"}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
