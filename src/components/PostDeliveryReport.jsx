import React, { useState } from 'react';

export default function PostDeliveryReport({ campaignId, initialPlatforms }) {
  const [reports, setReports] = useState(initialPlatforms || [
    { id: '1', platform: 'Instagram', status: 'POSTED', metrics: { views: 1420, engagement: 214 }, error: null },
    { id: '2', platform: 'Facebook', status: 'POSTED', metrics: { views: 890, engagement: 94 }, error: null },
    { id: '3', platform: 'X (Twitter)', status: 'FAILED', metrics: { views: 0, engagement: 0 }, error: '403 Forbidden - Rate limit exceeded or media structure format size invalid.' },
    { id: '4', platform: 'LinkedIn', status: 'PENDING', metrics: { views: 0, engagement: 0 }, error: null }
  ]);

  const handleRetry = (id) => {
    setReports(prev => prev.map(item => {
      if (item.id === id) return { ...item, status: 'PENDING', error: null };
      return item;
    }));

    setTimeout(() => {
      setReports(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, status: 'POSTED', metrics: { views: 5, engagement: 0 }, error: null };
        }
        return item;
      }));
    }, 1500);
  };

  const exportCSV = () => {
    const headers = 'Platform,Status,Views,Engagement,Errors\n';
    const rows = reports.map(r => `${r.platform},${r.status},${r.metrics.views},${r.metrics.engagement},"${r.error || 'None'}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Campaign_${campaignId || 'Delivery'}_Report.csv`);
    a.click();
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div>
          <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600' }}>Post Delivery Metrics & Analytics</h3>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '2px 0 0 0' }}>Real-time verification metrics and channel error logging.</p>
        </div>
        <button 
          onClick={exportCSV}
          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0f172a', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
        >
          Export CSV Report
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
              <th style={{ padding: '10px' }}>Platform Channel</th>
              <th style={{ padding: '10px' }}>Status</th>
              <th style={{ padding: '10px' }}>Views / Reach</th>
              <th style={{ padding: '10px' }}>Engagements</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Actions / Diagnostics</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <React.Fragment key={report.id}>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 10px', fontWeight: '500' }}>{report.platform}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{
                      padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
                      background: report.status === 'POSTED' ? '#dcfce7' : report.status === 'FAILED' ? '#fee2e2' : '#fef9c3',
                      color: report.status === 'POSTED' ? '#15803d' : report.status === 'FAILED' ? '#b91c1c' : '#a16207'
                    }}>
                      {report.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px' }}>{report.metrics.views.toLocaleString()}</td>
                  <td style={{ padding: '12px 10px' }}>{report.metrics.engagement.toLocaleString()}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                    {report.status === 'FAILED' && (
                      <button 
                        onClick={() => handleRetry(report.id)}
                        style={{ background: '#b91c1c', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        Retry Post
                      </button>
                    )}
                    {report.status === 'PENDING' && <span style={{ color: '#64748b', fontSize: '12px' }}>🔄 Distributing...</span>}
                    {report.status === 'POSTED' && <span style={{ color: '#16a34a', fontSize: '12px' }}>✓ Live</span>}
                  </td>
                </tr>
                {report.error && (
                  <tr>
                    <td colSpan="5" style={{ padding: '0 10px 10px 10px' }}>
                      <div style={{ background: '#fef2f2', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', color: '#991b1b' }}>
                        <strong>Post Error Log:</strong> {report.error}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
