import React, { useState } from "react";
import { getSupabaseCredentials, saveSupabaseCredentials, isSupabaseConfigured, supabase } from "../lib/supabase";
import { supabaseService } from "../services/supabaseService";

export function SupabaseConfigModal({ isOpen, onClose, onShowToast, onConfigUpdated }) {
  const current = getSupabaseCredentials();
  const [url, setUrl] = useState(current.url || "");
  const [anonKey, setAnonKey] = useState(current.anonKey || "");
  const [testing, setTesting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const isConnected = isSupabaseConfigured();

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    saveSupabaseCredentials(url, anonKey);
    onShowToast?.("Supabase configuration saved! Reloading connection...", "success");
    onConfigUpdated?.();
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setStatusMsg("");
    try {
      if (!url || !anonKey) throw new Error("Please enter both Supabase URL and Anon Key.");
      saveSupabaseCredentials(url, anonKey);

      const { data, error } = await supabase.from("curriculum_courses").select("count", { count: "exact" });
      if (error && error.code !== "PGRST116" && error.code !== "42P01") {
        throw error;
      }
      setStatusMsg("Connection verified! Supabase is responding successfully.");
      onShowToast?.("Connection verified successfully!", "success");
    } catch (err) {
      setStatusMsg("Connection test failed: " + (err.message || "Network error."));
    } finally {
      setTesting(false);
    }
  };

  const handleSeedCurriculum = async () => {
    setSeeding(true);
    try {
      const count = await supabaseService.seedCurriculumToSupabase();
      onShowToast?.(`Seeded ${count} Harvard CS courses into Supabase!`, "success");
      setStatusMsg(`Successfully seeded ${count} Harvard CS courses into Supabase.`);
    } catch (err) {
      setStatusMsg("Seeding failed: " + err.message + ". Make sure you have created the tables using supabase/schema.sql.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="transcript-modal-container" style={{ maxWidth: "680px" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-top-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.75rem", background: "var(--harvard-crimson)", color: "#FFFFFF" }}>
          <div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 800 }}>
              Supabase Cloud Database Settings
            </h3>
            <p style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.9)" }}>
              Connect Harvard CSE Portal directly to your PostgreSQL Supabase project
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", color: "#FFFFFF", fontSize: "1.4rem", cursor: "pointer" }}>
            &times;
          </button>
        </div>

        <div style={{ padding: "1.75rem" }}>
          {/* Status Chip */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: isConnected ? "#F0FDF4" : "#FFFBEB", border: `1.5px solid ${isConnected ? "#BBF7D0" : "#FDE68A"}`, borderRadius: "var(--radius-md)", padding: "0.85rem 1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: isConnected ? "#166534" : "#D97706" }} />
              <strong style={{ fontSize: "0.88rem", color: isConnected ? "#166534" : "#92400E" }}>
                {isConnected ? "Supabase Cloud Database Connected" : "Supabase Keys Not Configured (Using Local Storage Mode)"}
              </strong>
            </div>
            <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              PostgreSQL v15+
            </span>
          </div>

          {statusMsg && (
            <div style={{ background: "var(--bg-page)", border: "1px solid var(--border-light)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", fontSize: "0.82rem", marginBottom: "1.25rem" }}>
              {statusMsg}
            </div>
          )}

          <form onSubmit={handleSave}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                Supabase Project URL (e.g. https://your-project.supabase.co):
              </label>
              <input
                type="url"
                className="search-input-box"
                style={{ width: "100%", background: "#FFFFFF", fontFamily: "var(--font-mono)" }}
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                Supabase Anon Public API Key:
              </label>
              <input
                type="password"
                className="search-input-box"
                style={{ width: "100%", background: "#FFFFFF", fontFamily: "var(--font-mono)" }}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleTestConnection}
                disabled={testing}
              >
                {testing ? "Testing..." : "Test Connection"}
              </button>
              <button
                type="submit"
                className="btn-harvard"
              >
                Save & Connect Supabase
              </button>
              {isConnected && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleSeedCurriculum}
                  disabled={seeding}
                >
                  {seeding ? "Seeding..." : "Seed Harvard Syllabus to Supabase"}
                </button>
              )}
            </div>
          </form>

          {/* Quick SQL Migration guide box */}
          <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "1.25rem" }}>
            <h4 style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              Database Setup Instructions:
            </h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.75rem", lineHeight: 1.5 }}>
              A complete database schema with Row Level Security (RLS) is ready in <code style={{ fontFamily: "var(--font-mono)", background: "var(--bg-page)", padding: "2px 5px", borderRadius: "3px" }}>supabase/schema.sql</code>. Copy its contents into the Supabase SQL Editor and click <strong>Run</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
