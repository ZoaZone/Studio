import React, { useState } from "react";
import { base44 } from "../api/base44Client";

export default function MediaStudio() {
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [formData, setFormData] = useState({ creativeVision: "", format: "16:9", durationSeconds: 60 });

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleExecutePipeline = async () => {
    setLoading(true);
    try {
      const payload = { script: formData.creativeVision, format: formData.format, duration: formData.durationSeconds };
      const result = await base44.functions.invoke("generateMediaContent", payload);
      // Fallback: If AI hasn't returned a video yet, use a stable CDN stream for testing the player
      setProject({
        ...result,
        videoUrl: result?.videoUrl || "https://vjs.zencdn.net/v/oceans.mp4"
      });
    } catch (error) {
      console.error("PIPELINE ERROR:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>Automated Brand Studio</h1>
      
      <div style={{ marginTop: "20px" }}>
        <textarea name="creativeVision" value={formData.creativeVision} onChange={handleInputChange} 
          style={{ width: "100%", height: "150px", padding: "12px", borderRadius: "8px" }} placeholder="Describe your brand vision..." />
      </div>

      <button onClick={handleExecutePipeline} disabled={loading} style={{ marginTop: "20px", padding: "12px 24px", background: "#7f00ff", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
        {loading ? "Generating..." : "Execute Pipeline"}
      </button>

      <div style={{ marginTop: "30px", background: "#000", minHeight: "300px", borderRadius: "8px" }}>
        {project ? (
          <video src={project.videoUrl} controls style={{ width: "100%", borderRadius: "8px" }} autoPlay />
        ) : (
          <p style={{ color: "#fff", textAlign: "center", paddingTop: "140px" }}>
            {loading ? "AI is working..." : "Configure vision and execute to start."}
          </p>
        )}
      </div>
    </div>
  );
}