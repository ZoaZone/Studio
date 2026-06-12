import React, { useState } from 'react';

export default function UnifiedMarketingConsole() {
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  
  // Social Account Status Tracker
  const [socialAccounts, setSocialAccounts] = useState({
    instagram: { connected: false, checking: false, error: false },
    youtube: { connected: false, checking: false, error: false },
    tiktok: { connected: false, checking: false, error: false }
  });

  // Comprehensive Config State
  const [formData, setFormData] = useState({
    creativeVision: '',
    scannedWebsite: '',
    format: '9:16',
    durationSeconds: 30,
    captionStyle: 'complete',
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

  // Inline Social Credentials Verification Handler
  const verifySocialAccount = async (platform) => {
    setSocialAccounts(prev => ({ ...prev, [platform]: { ...prev[platform], checking: true, error: false } }));
    try {
      const response = await fetch('/api/media/verify-socials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, credentialsProvided: { token: 'valid_test_token' } })
      });
      const data = await response.json();
      if (data.connected) {
        setSocialAccounts(prev => ({ ...prev, [platform]: { connected: true, checking: false, error: false } }));
      } else {
        setSocialAccounts(prev => ({ ...prev, [platform]: { connected: false, checking: false, error: true } }));
      }
    } catch {
      setSocialAccounts(prev => ({ ...prev, [platform]: { connected: false, checking: false, error: true } }));
    }
  };

  // Run Integrated Pipeline Engine (Ingestion through Generation)
  const handleExecutePipeline = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/media/execute-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) setProject(data.project);
    } catch (err) {
      console.error("Pipeline failure:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1440px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', backgroundColor: '#fafafa', color: '#222' }}>
      
      {/* Header Panel */}
      <header style={{ marginBottom: '30px', borderBottom: '2px solid #eaeaea', paddingBottom: '15px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', color: '#111' }}>Auto-Pilot Social Marketing Console</h1>
        <p style={{ color: '#666', margin: '5px 0 0 0' }}>Unified Production & Distribution Workspace</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '30px' }}>
        
        {/* LEFT WORKSPACE: INGESTION & CONFIGURATION PARAMS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Phase 1: Ingestion Block */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '8px' }}>1. Brand Ingestion</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontWeight: '6px', marginBottom: '6px' }}>Scan Website for Assets & Logos</label>
              <input type="url" name="scannedWebsite" placeholder="https://yourbrand.com" value={formData.scannedWebsite} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontWeight: '6px', marginBottom: '6px' }}>Reference File Uploads</label>
              <div style={{ border: '2px dashed #ccc', padding: '15px', textAlign: 'center', borderRadius: '6px', cursor: 'pointer', background: '#fcfcfc' }}>
                <span style={{ fontSize: '13px', color: '#777' }}>Drag & Drop brand logos or image style-guides here</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '6px', marginBottom: '6px' }}>AI Creative Vision Prompt</label>
              <textarea name="creativeVision" placeholder="e.g., Summer collection drop featuring premium sustainable activewear..." value={formData.creativeVision} onChange={handleInputChange} style={{ width: '100%', height: '90px', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical' }} />
            </div>
          </div>

          {/* Phase 2: Restored Parameters Block */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '8px' }}>2. Output Configurations</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontWeight: '6px', marginBottom: '6px' }}>Video Format Aspect Ratio</label>
              <select name="format" value={formData.format} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                <option value="9:16">9:16 (TikTok / Reels / Shorts)</option>
                <option value="16:9">16:9 (YouTube Standard / Widescreen)</option>
                <option value="1:1">1:1 (Instagram Feed Square)</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontWeight: '6px', marginBottom: '6px' }}>Target Video Length</label>
              <select name="durationSeconds" value={formData.durationSeconds} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                <option value={15}>15 Seconds</option>
                <option value={30}>30 Seconds</option>
                <option value={60}>60 Seconds</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '6px', marginBottom: '6px' }}>Caption Generation Layout</label>
              <select name="captionStyle" value={formData.captionStyle} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                <option value="minimal">Minimal Captions (High Converting Hooks Only)</option>
                <option value="complete">Complete Inputs (In-depth Narrative + Auto Hashtags)</option>
              </select>
            </div>
          </div>

          {/* Target Distribution Setup */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '8px' }}>3. Target Platforms & Credentials</h3>
            
            {['instagram', 'youtube', 'tiktok'].map((platform) => (
              <div key={platform} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <label style={{ textTransform: 'capitalize', fontWeight: '500' }}>
                  <input type="checkbox" checked={formData.selectedPlatforms.includes(platform)} onChange={() => togglePlatformSelection(platform)} style={{ marginRight: '8px' }} />
                  {platform}
                </label>
                
                <button 
                  onClick={() => verifySocialAccount(platform)}
                  style={{
                    padding: '5px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid', cursor: 'pointer',
                    backgroundColor: socialAccounts[platform].connected ? '#e6f4ea' : '#fff',
                    color: socialAccounts[platform].connected ? '#137333' : '#555',
                    borderColor: socialAccounts[platform].connected ? '#137333' : '#ccc'
                  }}
                >
                  {socialAccounts[platform].checking ? 'Verifying...' : socialAccounts[platform].connected ? '✓ Connected' : 'Link Console Verification'}
                </button>
              </div>
            ))}

            <button 
              onClick={handleExecutePipeline} 
              disabled={loading || !formData.creativeVision}
              style={{ width: '100%', marginTop: '10px', background: '#7f00ff', color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
            >
              {loading ? 'Synchronizing Engine Assets...' : 'Trigger Synchronized Auto-Render'}
            </button>
          </div>
        </div>

        {/* RIGHT WORKSPACE: LIVE INTERCONNECTED PRODUCTION CANVAS MONITOR */}
        <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h2 style={{ marginTop: 0, fontSize: '20px', color: '#333' }}>Interconnected Production Canvas Monitor</h2>
          
          {!project ? (
            <div style={{ display: 'flex', height: '80%', alignItems: 'center', justifyContent: 'center', border: '2px dashed #eaeaea', borderRadius: '8px', color: '#aaa', padding: '100px 0' }}>
              Enter structural options and prompt pipeline configuration to stream synced creative video.
            </div>
          ) : (
            <div>
              {/* Top Bar Integrated Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f1f3f4', padding: '12px 20px', borderRadius: '8px', marginBottom: '24px', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 'bold', marginRight: '15px' }}>Status: Pipeline Assets Consolidated</span>
                  <span style={{ background: '#e8f0fe', color: '#1a73e8', padding: '4px 8px', borderRadius: '4px', fontSize: '13px' }}>Auto-Pilot Queue Active</span>
                </div>
                <button style={{ background: '#00c14d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Deploy Single-Click Auto-Publish Schedule
                </button>
              </div>

              {/* Interlinked Grid System */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* 1. Video Player Canvas */}
                <div style={{ border: '1px solid #e0e0e0', padding: '16px', borderRadius: '8px', background: '#fafafa' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>🎞️ Rendered Production Video</h4>
                  <video controls src={project.productionCanvas.generatedVideoUrl} style={{ width: '100%', borderRadius: '4px', background: '#000', maxHeight: '240px' }} />
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: '#666' }}>Format Aspect Ratio: {project.configuration.format}</span>
                    <a href={`/api/media/download-asset/${project._id}/generatedVideoUrl`} download style={{ color: '#7f00ff', fontWeight: 'bold', fontSize: '14px', textDecoration: 'none' }}>⬇ Download HD Clip</a>
                  </div>
                </div>

                {/* 2. Synced Thumbnail Component */}
                <div style={{ border: '1px solid #e0e0e0', padding: '16px', borderRadius: '8px', background: '#fafafa' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>🖼️ Synchronized Thumbnail Hook</h4>
                  <img src={project.productionCanvas.thumbnailUrl} alt="Synced Design Asset" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#666' }}>Matched Layout Design</span>
                    <a href={`/api/media/download-asset/${project._id}/thumbnailUrl`} download style={{ color: '#7f00ff', fontWeight: 'bold', fontSize: '14px', textDecoration: 'none' }}>⬇ Download Thumbnail PNG</a>
                  </div>
                </div>

                {/* 3. Cross-Linked Text Assets Block */}
                <div style={{ border: '1px solid #e0e0e0', padding: '16px', borderRadius: '8px', gridColumn: 'span 2', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0 }}>✍️ Connected Ad Copy, Scripts & Automated Hashtags</h4>
                    <a href={`/api/media/download-asset/${project._id}/videoScript`} download style={{ color: '#7f00ff', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none' }}>⬇ Download TXT Copy Manifesto</a>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <h5 style={{ margin: '0 0 5px 0', color: '#555' }}>Finalized Video Script Storyboard</h5>
                      <p style={{ background: '#f9f9f9', padding: '10px', borderRadius: '4px', fontSize: '13px', margin: 0 }}>{project.productionCanvas.videoScript}</p>
                    </div>
                    <div>
                      <h5 style={{ margin: '0 0 5px 0', color: '#555' }}>Platform Specific In-App Caption</h5>
                      <p style={{ background: '#f9f9f9', padding: '10px', borderRadius: '4px', fontSize: '13px', margin: 0 }}>{project.productionCanvas.caption}</p>
                      
                      <h5 style={{ margin: '10px 0 5px 0', color: '#555' }}>Context-Derived Hashtags</h5>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {project.productionCanvas.hashtags.map((tag, idx) => (
                          <span key={idx} style={{ background: '#f0e6ff', color: '#7f00ff', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Live Post-Publishing Analytics Telemetry */}
                <div style={{ border: '1px solid #e0e0e0', padding: '16px', borderRadius: '8px', gridColumn: 'span 2', background: '#f8f9fa' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>📊 Active Post-Publishing Reporting Channel</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', textAlign: 'center' }}>
                    <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>Delivery Delivery State</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00c14d' }}>Live Track Enabled</div>
                    </div>
                    <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>Aggregate Impression Streams</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>0 (Awaiting Queue)</div>
                    </div>
                    <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>Interactive Click Through</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>--</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
