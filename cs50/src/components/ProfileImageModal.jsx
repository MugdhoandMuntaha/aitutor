import React, { useState, useRef } from "react";
import { supabaseService } from "../services/supabaseService";
import { dataStore } from "../services/dataStore";

/**
 * Client-side helper to resize and compress image to crisp 320x320 data URL
 */
function processImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Selected file must be an image (PNG, JPG, WEBP)."));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed reading file."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed parsing image data."));
      img.onload = () => {
        const maxSize = 340;
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

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP or JPEG with high fidelity
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        resolve(compressedDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export function ProfileImageModal({ student, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState("upload"); // 'upload' | 'url' | 'presets'
  const [previewUrl, setPreviewUrl] = useState(student?.avatar || "");
  const [urlInput, setUrlInput] = useState(student?.avatar?.startsWith("http") ? student.avatar : "");
  const [fileName, setFileName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!student) return null;

  const defaultInitialsAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=A51C30&color=fff&size=256`;

  const PRESETS = [
    {
      name: "Crimson Veritas",
      url: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=A51C30&color=fff&size=256`
    },
    {
      name: "Harvard Navy",
      url: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=1E3A8A&color=fff&size=256`
    },
    {
      name: "Executive Slate",
      url: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=0F172A&color=fff&size=256`
    },
    {
      name: "Academic Gold",
      url: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=B45309&color=fff&size=256`
    },
    {
      name: "Scholarly Portrait A",
      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
    },
    {
      name: "Scholarly Portrait B",
      url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80"
    },
    {
      name: "Scholarly Portrait C",
      url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80"
    },
    {
      name: "Scholarly Portrait D",
      url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80"
    }
  ];

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file) => {
    setErrorMsg("");
    try {
      setFileName(file.name);
      const dataUrl = await processImageFile(file);
      setPreviewUrl(dataUrl);
    } catch (err) {
      setErrorMsg(err.message || "Failed to process photo.");
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleUrlApply = () => {
    setErrorMsg("");
    const clean = urlInput.trim();
    if (!clean) {
      setErrorMsg("Please enter an image URL.");
      return;
    }
    setPreviewUrl(clean);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg("");

    try {
      const finalAvatar = previewUrl || defaultInitialsAvatar;

      // Persist to Supabase and DataStore
      await supabaseService.updateStudentAvatar(student.id, finalAvatar);

      onUpdated?.(finalAvatar);
      onClose();
    } catch (err) {
      console.error("Failed saving avatar:", err);
      setErrorMsg(err.message || "Failed to save profile image.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPreviewUrl(defaultInitialsAvatar);
    setUrlInput("");
    setFileName("");
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="transcript-modal-container"
        style={{ maxWidth: "560px", overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div
          className="modal-top-bar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.25rem 1.75rem",
            background: "var(--harvard-crimson)",
            color: "#FFFFFF"
          }}
        >
          <div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", fontWeight: 800, margin: 0 }}>
              Update Student Profile Photo
            </h3>
            <span style={{ fontSize: "0.78rem", opacity: 0.9 }}>
              {student.name} &bull; {student.id}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "#FFFFFF", fontSize: "1.4rem", cursor: "pointer" }}
          >
            &times;
          </button>
        </div>

        <div style={{ padding: "1.75rem" }}>
          {/* Live Avatar Preview Section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: "1.5rem",
              paddingBottom: "1.5rem",
              borderBottom: "1px solid var(--border-light)"
            }}
          >
            <div
              style={{
                position: "relative",
                width: "128px",
                height: "128px",
                borderRadius: "22px",
                border: "4px solid var(--harvard-crimson)",
                boxShadow: "0 8px 24px rgba(165, 28, 48, 0.2)",
                overflow: "hidden",
                background: "var(--harvard-crimson-surface)",
                marginBottom: "0.75rem"
              }}
            >
              <img
                src={previewUrl || defaultInitialsAvatar}
                alt={student.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.target.src = defaultInitialsAvatar;
                }}
              />
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Live Profile Preview
            </span>
          </div>

          {/* Tab Selector */}
          <div
            style={{
              display: "flex",
              background: "var(--bg-page)",
              padding: "4px",
              borderRadius: "10px",
              marginBottom: "1.25rem",
              border: "1px solid var(--border-light)"
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "none",
                background: activeTab === "upload" ? "#FFFFFF" : "transparent",
                color: activeTab === "upload" ? "var(--harvard-crimson)" : "var(--text-secondary)",
                fontWeight: 700,
                fontSize: "0.82rem",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: activeTab === "upload" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s"
              }}
            >
              Upload Photo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "none",
                background: activeTab === "url" ? "#FFFFFF" : "transparent",
                color: activeTab === "url" ? "var(--harvard-crimson)" : "var(--text-secondary)",
                fontWeight: 700,
                fontSize: "0.82rem",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: activeTab === "url" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s"
              }}
            >
              Image URL
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("presets")}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "none",
                background: activeTab === "presets" ? "#FFFFFF" : "transparent",
                color: activeTab === "presets" ? "var(--harvard-crimson)" : "var(--text-secondary)",
                fontWeight: 700,
                fontSize: "0.82rem",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: activeTab === "presets" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s"
              }}
            >
              Avatar Presets
            </button>
          </div>

          {/* TAB 1: FILE UPLOAD */}
          {activeTab === "upload" && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? "var(--harvard-crimson)" : "var(--border-medium)"}`,
                  background: isDragging ? "var(--harvard-crimson-surface)" : "var(--bg-page)",
                  borderRadius: "12px",
                  padding: "2rem 1.5rem",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <svg
                  style={{ width: "42px", height: "42px", margin: "0 auto 0.75rem", color: "var(--harvard-crimson)" }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-main)", marginBottom: "4px" }}>
                  {fileName ? `Selected: ${fileName}` : "Click to select or drag photo here"}
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>
                  Supports PNG, JPG, JPEG, WEBP or GIF (automatically optimized)
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: WEB URL */}
          {activeTab === "url" && (
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Direct Image Link:
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="url"
                  className="search-input-box"
                  style={{ flex: 1, background: "#FFFFFF" }}
                  placeholder="https://example.com/photo.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: "0.6rem 1rem", fontSize: "0.82rem" }}
                  onClick={handleUrlApply}
                >
                  Preview
                </button>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px", marginBottom: 0 }}>
                Paste any publicly accessible URL for your profile picture.
              </p>
            </div>
          )}

          {/* TAB 3: SCHOLARLY PRESETS */}
          {activeTab === "presets" && (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "0.75rem",
                  maxHeight: "180px",
                  overflowY: "auto",
                  padding: "4px"
                }}
              >
                {PRESETS.map((p, idx) => {
                  const isSelected = previewUrl === p.url;
                  return (
                    <div
                      key={idx}
                      onClick={() => setPreviewUrl(p.url)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "8px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        border: isSelected ? "2px solid var(--harvard-crimson)" : "1px solid var(--border-light)",
                        background: isSelected ? "var(--harvard-crimson-surface)" : "#FFFFFF",
                        transition: "all 0.15s"
                      }}
                    >
                      <img
                        src={p.url}
                        alt={p.name}
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "12px",
                          objectFit: "cover",
                          marginBottom: "4px"
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 600,
                          textAlign: "center",
                          color: isSelected ? "var(--harvard-crimson)" : "var(--text-secondary)"
                        }}
                      >
                        {p.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Notice */}
          {errorMsg && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.6rem 0.9rem",
                borderRadius: "8px",
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                color: "#991B1B",
                fontSize: "0.82rem",
                fontWeight: 600
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1.75rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid var(--border-light)"
            }}
          >
            <button
              type="button"
              onClick={handleReset}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              Reset to Initials
            </button>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={isSaving}
                style={{ padding: "0.6rem 1.25rem", fontSize: "0.85rem" }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-harvard"
                onClick={handleSave}
                disabled={isSaving}
                style={{ padding: "0.6rem 1.4rem", fontSize: "0.85rem" }}
              >
                {isSaving ? "Saving..." : "Save Profile Photo"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
