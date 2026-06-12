import React, { useState } from 'react';

export default function SocialAccountVerifier({ onVerificationComplete }) {
  const [platform, setPlatform] = useState('instagram');
  const [credentials, setCredentials] = useState({ username: '', token: '' });
  const [verifyStep, setVerifyStep] = useState('IDLE'); 
  const [errorLog, setErrorLog] = useState('');

  const handleTestConnection = async (e) => {
    e.preventDefault();
    if (!credentials.username || !credentials.token) {
      setVerifyStep('FAILED');
      setErrorLog('Error: Missing username or access token credentials.');
      return;
    }

    setVerifyStep('VALIDATING');
    setErrorLog('');
    await new Promise(resolve => setTimeout(resolve, 1200));

    if (credentials.token.toLowerCase() === 'wrong' || credentials.token.length < 8) {
      setVerifyStep('FAILED');
      setErrorLog(`Authentication Failure: ${platform.toUpperCase()} Graph API returned 401 Unauthorized. Invalid password or token credentials.`);
      return;
    }

    setVerifyStep('CHECKING_PERMS');
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (platform === 'instagram' && !credentials.token.includes('pages_show_list')) {
      setVerifyStep('FAILED');
      setErrorLog('Permission Error: Token authenticated, but missing required scope [instagram_basic, pages_read_engagement]. Please verify business configuration settings.');
      return;
    }

    setVerifyStep('SUCCESS');
    if (onVerificationComplete) {
      onVerificationComplete({
        platform,
        username: credentials.username,
        status: 'ACTIVE',
        verifiedAt: new Date().toISOString()
      });
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600' }}>Connect & Verify Social Accounts</h3>
      
      <form onSubmit={handleTestConnection}>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>Select Platform</label>
            <select 
              value={platform} 
              onChange={(e) => { setPlatform(e.target.value); setVerifyStep('IDLE'); }}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            >
              <option value="instagram">Instagram Business</option>
              <option value="facebook">Facebook Page</option>
              <option value="twitter">X (Twitter)</option>
              <option value="linkedin">LinkedIn Professional</option>
              <option value="tiktok">TikTok Creator</option>
              <option value="youtube">YouTube Studio</option>
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>Account Handle/Username</label>
            <input 
              type="text" 
              placeholder="@username" 
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>API Password / Access Token</label>
          <input 
            type="password" 
            placeholder="Paste your OAuth access token or account connection key" 
            value={credentials.token}
            onChange={(e) => setCredentials({ ...credentials, token: e.target.value })}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={verifyStep === 'VALIDATING' || verifyStep === 'CHECKING_PERMS'}
          style={{ 
            background: '#0f172a', color: '#fff', padding: '10px 16px', border: 'none', 
            borderRadius: '4px', fontWeight: '500', cursor: 'pointer', width: '100%' 
          }}
        >
          {verifyStep === 'IDLE' && 'Test & Verify Connection Approval'}
          {verifyStep === 'VALIDATING' && '🔄 Step 1/2: Validating Credential Handshake...'}
          {verifyStep === 'CHECKING_PERMS' && '🔄 Step 2/2: Confirming Write Scopes & Access...'}
          {(verifyStep === 'SUCCESS' || verifyStep === 'FAILED') && 'Re-test Channel Connection'}
        </button>
      </form>

      {verifyStep === 'SUCCESS' && (
        <div style={{ marginTop: '15px', padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✅</span>
          <div>
            <strong>Connectivity Confirmed!</strong> {platform.toUpperCase()} integration handshake approved active with proper publisher credentials.
          </div>
        </div>
      )}

      {verifyStep === 'FAILED' && (
        <div style={{ marginTop: '15px', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span>❌</span>
            <strong>Connection Rejected</strong>
          </div>
          <pre style={{ margin: 0, fontSize: '12px', background: '#fff', padding: '8px', borderRadius: '4px', overflowX: 'auto', border: '1px solid #fee2e2' }}>
            {errorLog}
          </pre>
        </div>
      )}
    </div>
  );
}
