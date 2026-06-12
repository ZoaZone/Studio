import React, { useState } from "react";
import { base44 } from "../api/base44Client";

export default function MediaStudio() {
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [formData, setFormData] = useState({ creativeVision: "", format: "16:9", duration: 60 });

  const handleExecutePipeline = async () => {
    setLoading(true);
    try {
      const payload = { 
        script: formData.creativeVision, 
        format: formData.format, 
        duration: formData.duration,
        timestamp: new Date().toISOString()
      };
      const result = await base44.functions.invoke("generateMediaContent", payload);
      setProject(result);
    } catch (err) { 
      console.error("Payload Error:", err);
      alert("Error: " + err.message); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>Automated Brand Studio</h1>
      <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "40px" }}>
        <div style={{ background: "#f9f9f9", padding: "20px", borderRadius: "12px", border: "1px solid #eee" }}>
          <label><strong>Brand Vision</strong></label>
          <textarea 
            onChange={(e) => setFormData({...formData, creativeVision: e.target.value})}
            style={{ width: "100%", height: "150px", marginBottom: "15px" }} 
          />
          <button onClick={handleExecutePipeline} disabled={loading} style={{ width: "100%", padding: "12px", background: "#7f00ff", color: "#fff", borderRadius: "6px" }}>
            {loading ? "Generating..." : "Execute Pipeline"}
          </button>
        </div>
        <div style={{ background: "#000", borderRadius: "12px", minHeight: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {project ? <video src={project.videoUrl} controls autoPlay style={{ width: "100%" }} /> : <p style={{ color: "#fff" }}>{loading ? "AI is generating..." : "Configure vision to generate media."}</p>}
        </div>
      </div>
    </div>
  );
}