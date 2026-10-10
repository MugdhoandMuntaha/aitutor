import React, { useState, useRef } from "react";
import { dataStore } from "../services/dataStore";

export function NewStudentModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    batch: "Class of 2027 (Freshman)",
    semester: 1,
    concentration: "Computer Science & Engineering",
    advisor: ""
  });
  const [customAvatar, setCustomAvatar] = useState("");
  const fileInputRef = useRef(null);

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 320;
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        setCustomAvatar(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.id.trim() || !formData.name.trim()) return;

    try {
      const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=A51C30&color=fff`;
      const newStd = {
        id: formData.id.trim(),
        name: formData.name.trim(),
        email: formData.email.trim() || `${formData.name.toLowerCase().replace(/\s+/g, ".")}@college.harvard.edu`,
        avatar: customAvatar || defaultAvatar,
        batch: formData.batch,
        enrolledYear: new Date().getFullYear(),
        currentSemester: parseInt(formData.semester),
        advisor: formData.advisor.trim() || "Faculty Academic Advisor (SEAS)",
        concentration: formData.concentration.trim() || "Computer Science & Engineering",
        academicStatus: "Active - Enrolled Good Standing",
        semesters: [
          {
            semesterNumber: parseInt(formData.semester),
            term: `Semester ${formData.semester}`,
            isPublished: false,
            publishDate: null,
            results: [] // Clean empty results - waiting for instructor/admin marks entry
          }
        ]
      };

      dataStore.addStudent(newStd);
      onCreated(newStd.id);
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="transcript-modal-container" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-top-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.75rem", background: "var(--harvard-crimson)", color: "#FFFFFF" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", fontWeight: 800 }}>
            Enroll New Harvard CSE Student
          </h3>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", color: "#FFFFFF", fontSize: "1.4rem", cursor: "pointer" }}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "1.75rem" }}>
          {/* Student Profile Picture Upload Box */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem", padding: "10px 14px", background: "var(--bg-page)", borderRadius: "10px", border: "1px solid var(--border-light)" }}>
            <div style={{ width: "54px", height: "54px", borderRadius: "12px", border: "2px solid var(--harvard-crimson)", overflow: "hidden", background: "#FFFFFF", flexShrink: 0 }}>
              <img
                src={customAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || "Student")}&background=A51C30&color=fff`}
                alt="Avatar Preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
                Student Photo / Avatar
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                style={{ display: "none" }}
              />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: "0.75rem", padding: "3px 10px" }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Photo
                </button>
                {customAvatar && (
                  <button
                    type="button"
                    style={{ background: "transparent", border: "none", color: "#DC2626", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}
                    onClick={() => setCustomAvatar("")}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
              Student ID Number:
            </label>
            <input
              type="text"
              className="search-input-box"
              style={{ width: "100%", background: "#FFFFFF" }}
              placeholder="e.g. HAR-CS-2025-001"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              required
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
              Student Full Name:
            </label>
            <input
              type="text"
              className="search-input-box"
              style={{ width: "100%", background: "#FFFFFF" }}
              placeholder="e.g. Jonathan R. Vance"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
              Harvard College Email:
            </label>
            <input
              type="email"
              className="search-input-box"
              style={{ width: "100%", background: "#FFFFFF" }}
              placeholder="e.g. j.vance@college.harvard.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                Cohort / Batch:
              </label>
              <input
                type="text"
                className="search-input-box"
                style={{ width: "100%", background: "#FFFFFF" }}
                value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                Current Semester:
              </label>
              <select
                className="search-input-box"
                style={{ width: "100%", background: "#FFFFFF" }}
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>Semester {n}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
              Concentration Track:
            </label>
            <input
              type="text"
              className="search-input-box"
              style={{ width: "100%", background: "#FFFFFF" }}
              placeholder="e.g. Systems & AI, Theory & Algorithms"
              value={formData.concentration}
              onChange={(e) => setFormData({ ...formData, concentration: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
              Faculty Advisor:
            </label>
            <input
              type="text"
              className="search-input-box"
              style={{ width: "100%", background: "#FFFFFF" }}
              placeholder="e.g. Prof. David J. Malan (SEAS)"
              value={formData.advisor}
              onChange={(e) => setFormData({ ...formData, advisor: e.target.value })}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-harvard">
              Enroll Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
