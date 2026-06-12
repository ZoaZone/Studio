import React, { useState } from 'react';
import BrandedAssetsPicker from './BrandedAssetsPicker';
import SocialAccountVerifier from './SocialAccountVerifier';
import PostDeliveryReport from './PostDeliveryReport';

export default function CampaignStudio() {
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    plan: '',
    script: '',
    verifiedAccounts: [],
    brandingAssets: null,
    generatedMediaUrl: null
  });

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 7));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '20px', fontFamily: 'system-ui, sans-serif', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
        {['1. Plan', '2. Script', '3. Channels', '4. Brand Assets', '5. Generation', '6. Schedule', '7. Delivery Analytics'].map((label, idx) => (
          <div key={label} style={{ 
            fontSize: '13px', fontWeight: currentStep === idx + 1 ? '700' : '400',
            color: currentStep === idx + 1 ? '#2563eb' : '#94a3b8',
            borderBottom: currentStep === idx + 1 ? '2px solid #2563eb' : 'none',
            paddingBottom: '4px'
          }}>
            {label}
          </div>
        ))}
      </div>

      <div style={{ minHeight: '300px', marginBottom: '30px' }}>
        {currentStep === 1 && (
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Initial Campaign Content Planning</h2>
            <textarea 
              style={{ width: '100%', height: '120px', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              placeholder="Describe your overall campaign vision strategy goals..." 
              value={campaignData.plan}
              onChange={(e) => setCampaignData({...campaignData, plan: e.target.value})}
            />
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Script Making & Reference Links</h2>
            <textarea 
              style={{ width: '100%', height: '120px', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', marginBottom: '10px', boxSizing: 'border-box' }}
              placeholder="Write out raw narration dialog lines or text scripts here..." 
              value={campaignData.script}
              onChange={(e) => setCampaignData({...campaignData, script: e.target.value})}
            />
            <input type="text" placeholder="Paste structural drive asset attachments URLs for source references..." style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Multi-Channel Publishing Approvals</h2>
            <SocialAccountVerifier 
              onVerificationComplete={(account) => {
                setCampaignData(prev => ({...prev, verifiedAccounts: [...prev.verifiedAccounts, account]}));
              }}
            />
            <div style={{ marginTop: '15px', fontSize: '14px' }}>
              <strong>Confirmed Active Posting Channels:</strong> {campaignData.verifiedAccounts.length === 0 ? 'None selected yet.' : campaignData.verifiedAccounts.map(a => `${a.platform} (${a.username})`).join(', ')}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Incorporate Visual Branding Logo Assets</h2>
            <BrandedAssetsPicker 
              onAssetsSelected={(branding) => {
                setCampaignData(prev => ({ ...prev, brandingAssets: branding }));
              }}
            />
          </div>
        )}

        {currentStep === 5 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>AI Media Creation Video Render Engine</h2>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>
              {campaignData.brandingAssets?.isApprovedForGeneration 
                ? `Ready to generate video embedding Primary Character Context Asset.` 
                : 'Warning: No character assets loaded or legal copyright approval skipped.'}
            </p>
            <button 
              type="button"
              onClick={() => setCampaignData({...campaignData, generatedMediaUrl: 'https://placeholder.mp4'})}
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
            >
              Execute AI Render Run
            </button>
            {campaignData.generatedMediaUrl && <div style={{ marginTop: '15px', color: '#16a34a', fontWeight: '500' }}>🎉 Content Render Completed Successfully! Ready for review.</div>}
          </div>
        )}

        {currentStep === 6 && (
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Review, Multi-Channel Scheduling & Posting</h2>
            <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '6px', marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 5px 0' }}>Review Script Material:</h4>
              <p style={{ fontStyle: 'italic', margin: 0, fontSize: '14px' }}>"{campaignData.script || 'No script compiled yet.'}"</p>
            </div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Select Delivery Publication Date</label>
            <input type="datetime-local" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
          </div>
        )}

        {currentStep === 7 && (
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Automated Posting Delivery Deliverables Reporting</h2>
            <PostDeliveryReport campaignId="7742" />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
        <button 
          type="button"
          onClick={prevStep} 
          disabled={currentStep === 1}
          style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: currentStep === 1 ? 'not-allowed' : 'pointer', background: '#fff' }}
        >
          Back
        </button>
        <button 
          type="button"
          onClick={nextStep}
          disabled={currentStep === 7}
          style={{ padding: '8px 16px', borderRadius: '4px', background: '#0f172a', color: '#fff', border: 'none', cursor: currentStep === 7 ? 'not-allowed' : 'pointer' }}
        >
          {currentStep === 6 ? 'Schedule & Post' : currentStep === 7 ? 'Finished' : 'Next Step'}
        </button>
      </div>

    </div>
  );
}
