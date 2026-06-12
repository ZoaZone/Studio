import React, { useState } from "react";
import { base44 } from "../api/base44Client";

export default function MediaStudio() {
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [formData, setFormData] = useState({ creativeVision: "", format: "16:9", durationSeconds: 60 });

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleExecutePipeline = async () => {
    setLoading(true);
    console.log("Pipeline initiated with vision:", formData.creativeVision);
    
    try {
      const payload = { script: formData.creativeVision, format: formData.format, duration: formData.durationSeconds };
      
      // The invocation that is currently failing
      const result = await base44.functions.invoke("generateMediaContent", payload);
      
      console.log("AI Backend Response:", result);
      setProject(result);
    } catch (error) {
      console.error("PIPELINE ERROR:", error);
      alert("Error: Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Automated Brand Studio</h1>
      <textarea name="creativeVision" value={formData.creativeVision} onChange={handleInputChange} style={{ width: "100%", height: "100px" }} />
      <button onClick={handleExecutePipeline} disabled={loading} style={{ marginTop: "20px", padding: "10px 20px" }}>
        {loading ? "Generating..." : "Execute Pipeline"}
      </button>

      <div style={{ marginTop: "30px" }}>
        {project ? (
          <video src={project.videoUrl} controls style={{ width: "100%" }} />
        ) : (
          <p>{loading ? "AI is working... (Check Console if this takes > 10s)" : "Ready to generate."}</p>
        )}
      </div>
    </div>
  );
}