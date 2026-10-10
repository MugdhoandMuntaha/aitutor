import React, { useState } from "react";
import { dataStore } from "../services/dataStore";

export function CurriculumModal({ onClose }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const curriculum = dataStore.getCurriculum();

  const allCourses = [];
  curriculum.forEach((s) => {
    s.courses.forEach((c) => {
      allCourses.push({ ...c, semester: s.semester, term: s.termName });
    });
  });

  const categories = [
    "all",
    "Core Software",
    "Computer Systems",
    "Theoretical CS",
    "AI & Data Science",
    "Mathematics",
    "Computer Engineering",
    "Capstone"
  ];

  const filtered = selectedCategory === "all"
    ? allCourses
    : allCourses.filter((c) => c.category === selectedCategory);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="transcript-modal-container" style={{ maxWidth: "880px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-top-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.75rem", background: "var(--harvard-crimson)", color: "#FFFFFF" }}>
          <div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 800 }}>
              Harvard University SEAS &bull; Computer Science Syllabus
            </h3>
            <p style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.9)" }}>
              Accredited 8-Semester Bachelor of Science in Computer Science & Engineering (B.Sc. CSE) Roadmap
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", color: "#FFFFFF", fontSize: "1.4rem", cursor: "pointer" }}>
            &times;
          </button>
        </div>

        <div style={{ padding: "1.75rem" }}>
          {/* Category Chips */}
          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.75rem", marginBottom: "1.25rem" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`demo-chip-pill ${selectedCategory === cat ? "active" : ""}`}
                style={{ whiteSpace: "nowrap" }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === "all" ? "All Disciplines" : cat}
              </button>
            ))}
          </div>

          {/* Courses List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "58vh", overflowY: "auto", paddingRight: "6px" }}>
            {filtered.map((c) => (
              <div key={c.code} style={{ background: "var(--bg-page)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "1.1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem", gap: "1rem" }}>
                  <div>
                    <span className="code-badge" style={{ fontSize: "1.05rem" }}>{c.code}</span>
                    <span style={{ fontWeight: 700, fontSize: "1rem", marginLeft: "0.5rem" }}>{c.title}</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", padding: "2px 8px", background: "#FFFFFF", border: "1px solid var(--border-light)", borderRadius: "4px" }}>
                      {c.category}
                    </span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--harvard-crimson)", fontFamily: "var(--font-mono)" }}>
                      {c.credits.toFixed(1)} Credits
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "0.6rem" }}>
                  {c.description}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-light)", paddingTop: "0.5rem" }}>
                  <span><strong>Prerequisites:</strong> {c.prerequisites}</span>
                  <span><strong>Recommended Term:</strong> Semester {c.semester}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
            <button type="button" className="btn-harvard" onClick={onClose}>
              Close Syllabus Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
