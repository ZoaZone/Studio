import React, { useState } from "react";
import { base44 } from "../api/base44Client";

export default function MediaStudio() {
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [formData, setFormData] = useState({ 
    creativeVision: "", 
    format: "16:9", 
    duration: 60, 
    mode: "professional" 
  });

  const handleExecutePipeline = async () => {
    setLoading(true);
    try {
      const payload = { 
        script: formData.creativeVision, 
        format: formData.format, 
        duration: parseInt(formData.duration),
        mode: formData.mode,
        timestamp: new Date().toISOString()
      };
      // Invoking the backend function
      const result = await base44.functions.invoke("generateMediaContent", payload);
      setProject(result);
    } catch (err) { 
      alert("Pipeline Error: " + err.message); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>Automated Brand Studio</h1>
      <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "40px" }}>
        
        {/* Input Panel */}
        <div style={{ background: "#f9f9f9", padding: "20px", borderRadius: "12px", border: "1px solid #eee" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Brand Vision</label>
          <textarea 
            onChange={(e) => setFormData({...formData, creativeVision: e.target.value})} 
            style={{ width: "100%", height: "100px", marginBottom: "15px" }} 
          />
          
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Format</label>
          <select onChange={(e) => setFormData({...formData, format: e.target.value})} style={{ width: "100%", marginBottom: "10px" }}>
            <option value="16:9">16:9 Widescreen</option>
            <option value="9:16">9:16 Vertical</option>
          </select>

          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Duration (sec)</label>
          <input type="number" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} style={{ width: "100%", marginBottom: "10px" }} />

          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Mode</label>
          <select onChange={(e) => setFormData({...formData, mode: e.target.value})} style={{ width: "100%", marginBottom: "20px" }}>
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="energetic">Energetic</option>
          </select>

          <button onClick={handleExecutePipeline} disabled={loading} style={{ width: "100%", padding: "12px", background: "#7f00ff", color: "#fff", borderRadius: "6px" }}>
            {loading ? "Generating..." : "Execute Pipeline"}
          </button>
        </div>

        {/* Preview Panel */}
        <div style={{ background: "#000", borderRadius: "12px", minHeight: "300px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {project ? (
            <>
              <video src={project.videoUrl} controls autoPlay style={{ width: "100%", borderRadius: "12px" }} />
              <a href={project.videoUrl} download style={{ marginTop: "20px", color: "#fff", textDecoration: "underline" }}>Download Video</a>
            </>
          ) : (
            <p style={{ color: "#fff" }}>{loading ? "AI is generating..." : "Configure vision to generate media."}</p>
          )}
        </div>
      </div>
    </div>
  );
}