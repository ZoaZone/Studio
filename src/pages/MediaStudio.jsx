import React, { useState } from "react";
export default function MediaStudio() {
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [formData, setFormData] = useState({ creativeVision: "" });

  const handleExecutePipeline = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke("generateMediaContent", { 
        script: formData.creativeVision 
      });
      setProject(result);
    } catch (err) { alert("Pipeline error: " + err.message); }
    setLoading(false);
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>Automated Brand Studio</h1>
      <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "40px", marginTop: "20px" }}>
        <div style={{ background: "#f9f9f9", padding: "20px", borderRadius: "12px" }}>
          <textarea 
            placeholder="Describe your brand vision..." 
            onChange={(e) => setFormData({...formData, creativeVision: e.target.value})}
            style={{ width: "100%", height: "200px", padding: "10px", borderRadius: "6px" }} 
          />
          <button onClick={handleExecutePipeline} disabled={loading} style={{ marginTop: "15px", width: "100%", padding: "12px", background: "#7f00ff", color: "#fff", border: "none", borderRadius: "6px" }}>
            {loading ? "Processing..." : "Execute Pipeline"}
          </button>
        </div>
        <div style={{ background: "#000", borderRadius: "12px", minHeight: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {project ? <video src={project.videoUrl} controls style={{ width: "100%" }} /> : <p style={{ color: "#fff" }}>{loading ? "AI is generating..." : "Configure vision to generate media."}</p>}
        </div>
      </div>
    </div>
  );
}
