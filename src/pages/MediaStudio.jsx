import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Video, Layers, FileText, Megaphone, Hash, Download,
  Upload, RefreshCw, Play
} from "lucide-react";
import { base44 } from "../api/base44Client";

export default function MediaStudio() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [uploadedBrandFiles, setUploadedBrandFiles] = useState([]);
  const [vaultItems, setVaultItems] = useState([]);
  
  const [socialAccounts, setSocialAccounts] = useState({
    instagram: { connected: false },
    youtube: { connected: false },
    tiktok: { connected: false }
  });

  const [formData, setFormData] = useState({
    creativeVision: "",
    scannedWebsite: "",
    format: "16:9",
    durationSeconds: 60,
    captionStyle: "complete",
    selectedPlatforms: []
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePlatformSelection = (platform) => {
    const current = [...formData.selectedPlatforms];
    const index = current.indexOf(platform);
    if (index > -1) current.splice(index, 1);
    else current.push(platform);
    setFormData({ ...formData, selectedPlatforms: current });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const localObjectURL = URL.createObjectURL(file);
    setUploadedBrandFiles([{ id: "file_" + Date.now(), fileName: file.name, fileUrl: localObjectURL }]);
  };

  const verifySocialAccount = (platform) => {
    setSocialAccounts(prev => ({ ...prev, [platform]: { connected: true } }));
  };

  const handleExecutePipeline = async () => {
    setLoading(true);
    const logoContext = uploadedBrandFiles.length > 0 ? `[Using Logo: ${uploadedBrandFiles[0].fileName}]` : "";
    const websiteContext = formData.scannedWebsite ? `[Site: ${formData.scannedWebsite}]` : "";
    const masterScript = `[Script - ${formData.durationSeconds}s] ${logoContext} ${websiteContext} Vision: ${formData.creativeVision}.`;

    const payload = {
      script: masterScript,
      vision: formData.creativeVision,
      format: formData.format,
      duration: formData.durationSeconds,
      platforms: formData.selectedPlatforms
    };

    try {
      const result = await base44.functions.invoke("generateMediaContent", payload);
      setProject(result);
      setVaultItems(prev => [result, ...prev]);
    } catch (error) {
      console.error("Pipeline request failed:", error);
      alert("Pipeline Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ padding: "30px", maxWidth: "1440px", margin: "0 auto", fontFamily: "system-ui, sans-serif", backgroundColor: "#fafafa", color: "#222" }}>
      <header style={{ marginBottom: "30px", borderBottom: "2px solid #eaeaea", paddingBottom: "15px" }}>
        <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "700" }}>Unified Automated Brand Studio</h1>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: "30px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Controls - Same structure as your existing UI */}
          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "6px" }}>Creative Brand Vision</label>
            <textarea name="creativeVision" value={formData.creativeVision} onChange={handleInputChange} style={{ width: "100%", height: "150px", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />
            <button onClick={handleExecutePipeline} disabled={loading} style={{ width: "100%", marginTop: "15px", padding: "14px", background: "#7f00ff", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              {loading ? "Processing..." : "Execute Automated Generation Pipeline"}
            </button>
          </div>
        </div>
        <div style={{ background: "#fff", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          {project ? (
            <div style={{ background: "#000", borderRadius: "8px", overflow: "hidden", height: "300px" }}>
              <video controls autoPlay muted loop style={{ width: "100%", height: "100%", objectFit: "contain" }}>
                <source src={project.videoUrl || "https://vjs.zencdn.net/v/oceans.mp4"} type="video/mp4" />
              </video>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "100px", color: "#999" }}>Orchestrating...</div>
          )}
        </div>
      </div>
    </div>
  );
}