import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "../api/base44Client";
import {
  Sparkles, Video, Layers, FileText, Download, Upload
} from "lucide-react";

export default function MediaStudio() {
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [formData, setFormData] = useState({
    creativeVision: "",
    scannedWebsite: "",
    format: "16:9",
    durationSeconds: 60
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleExecutePipeline = async () => {
    setLoading(true);
    setProject(null); // Reset preview
    
    const payload = {
      script: formData.creativeVision,
      website: formData.scannedWebsite,
      format: formData.format,
      duration: formData.durationSeconds
    };

    try {
      // Direct invocation of the backend function you listed earlier
      const result = await base44.functions.invoke("generateMediaContent", payload);
      
      // If result exists, update project state to trigger re-render
      if (result) {
        setProject(result);
      } else {
        throw new Error("No media content generated.");
      }
    } catch (error) {
      console.error("Pipeline Error:", error);
      alert("Pipeline Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "30px", maxWidth: "1440px", margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ marginBottom: "30px", borderBottom: "2px solid #eaeaea", paddingBottom: "15px" }}>
        <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "700" }}>Unified Automated Brand Studio</h1>
      </header>
      
      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: "30px" }}>
        {/* Input Section */}
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "6px" }}>Creative Brand Vision</label>
          <textarea 
            name="creativeVision" 
            value={formData.creativeVision} 
            onChange={handleInputChange} 
            style={{ width: "100%", height: "150px", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} 
          />
          <button 
            onClick={handleExecutePipeline} 
            disabled={loading} 
            style={{ width: "100%", marginTop: "15px", padding: "14px", background: "#7f00ff", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
          >
            {loading ? "Processing..." : "Execute Automated Generation Pipeline"}
          </button>
        </div>

        {/* Output Section */}
        <div style={{ background: "#fff", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          {project ? (
            <div style={{ background: "#000", borderRadius: "8px", overflow: "hidden", height: "300px" }}>
              <video 
                controls 
                autoPlay 
                muted 
                loop 
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              >
                <source src={project.videoUrl || "https://vjs.zencdn.net/v/oceans.mp4"} type="video/mp4" />
              </video>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "100px", color: "#999" }}>
              {loading ? "AI is generating your video..." : "Configure vision and execute pipeline to start."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}