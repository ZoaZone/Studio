import React, { useState } from 'react';

export default function BrandedAssetsPicker({ onAssetsSelected }) {
  const [assets, setAssets] = useState([]);
  const [primaryAssetId, setPrimaryAssetId] = useState(null);
  const [legalConsent, setLegalConsent] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    
    setTimeout(() => {
      const newAssets = files.map((file, index) => ({
        id: `asset_${Date.now()}_${index}`,
        name: file.name,
        type: file.type.includes('image') ? 'logo' : 'character',
        url: URL.createObjectURL(file),
      }));

      const updated = [...assets, ...newAssets];
      setAssets(updated);
      
      if (!primaryAssetId && updated.length > 0) {
        setPrimaryAssetId(updated[0].id);
      }
      
      setUploading(false);
      triggerCallback(updated, primaryAssetId || updated[0].id, legalConsent);
    }, 1000);
  };

  const togglePrimary = (id) => {
    setPrimaryAssetId(id);
    triggerCallback(assets, id, legalConsent);
  };

  const handleConsentChange = (e) => {
    setLegalConsent(e.target.checked);
    triggerCallback(assets, primaryAssetId, e.target.checked);
  };

  const triggerCallback = (currentAssets, primaryId, consent) => {
    if (onAssetsSelected) {
      onAssetsSelected({
        assets: currentAssets,
        primaryAsset: currentAssets.find(a => a.id === primaryId) || null,
        isApprovedForGeneration: consent && currentAssets.length > 0
      });
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600' }}>1. Branding & Character Assets</h3>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '15px' }}>
        Upload your branding logo or character models to inject them into the AI video/image generator.
      </p>

      <div style={{ 
        border: '2px dashed #cbd5e1', borderRadius: '6px', padding: '20px', 
        textAlign: 'center', cursor: 'pointer', background: '#f8fafc', marginBottom: '20px' 
      }}>
        <input 
          type="file" 
          multiple 
          accept="image/*, .obj, .fbx, .gltf" 
          onChange={handleFileUpload} 
          style={{ display: 'none' }} 
          id="brand-asset-input"
        />
        <label htmlFor="brand-asset-input" style={{ cursor: 'pointer', display: 'block', width: '100%' }}>
          {uploading ? 'Uploading assets...' : 'Drag & drop or click to upload Logos / Character models'}
        </label>
      </div>

      {assets.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {assets.map((asset) => (
            <div key={asset.id} style={{ 
              border: `2px solid ${primaryAssetId === asset.id ? '#3b82f6' : '#e2e8f0'}`,
              borderRadius: '6px', padding: '8px', position: 'relative', textAlign: 'center'
            }}>
              {asset.type === 'logo' ? (
                <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '70px', objectFit: 'contain' }} />
              ) : (
                <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', fontSize: '12px' }}>
                  📦 3D Model
                </div>
              )}
              <div style={{ fontSize: '11px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '4px' }}>
                {asset.name}
              </div>
              <button 
                type="button"
                onClick={() => togglePrimary(asset.id)}
                style={{
                  marginTop: '6px', width: '100%', padding: '2px 4px', fontSize: '10px',
                  background: primaryAssetId === asset.id ? '#3b82f6' : '#f1f5f9',
                  color: primaryAssetId === asset.id ? '#fff' : '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer'
                }}
              >
                {primaryAssetId === asset.id ? '★ Primary' : 'Set Primary'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#f0fdf4', padding: '12px', borderRadius: '6px' }}>
        <input 
          type="checkbox" 
          id="legal-consent" 
          checked={legalConsent} 
          onChange={handleConsentChange}
          style={{ marginTop: '3px' }}
        />
        <label htmlFor="legal-consent" style={{ fontSize: '13px', color: '#166534', cursor: 'pointer' }}>
          <strong>Legal Consent:</strong> I confirm that I own the copyrights or have express permission to use these branding logos/characters for public automated AI video generation.
        </label>
      </div>
    </div>
  );
}
