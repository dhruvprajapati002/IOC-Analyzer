import type { IOCDetailData } from '../components/detail/types';
import { APP_COLORS } from '@/lib/colors';

function escapeHTML(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getVerdictColor(verdict?: string) {
  const v = (verdict || '').toLowerCase();
  if (v === 'malicious') return '#ef4444'; // Red
  if (v === 'suspicious') return '#eab308'; // Yellow
  if (v === 'clean' || v === 'harmless') return '#22c55e'; // Green
  return '#94a3b8'; // Unknown / Gray
}

function getRiskScoreColor(score: number | null | undefined) {
  if (score === null || score === undefined) return '#94a3b8';
  if (score <= 30) return '#22c55e'; // Green
  if (score <= 69) return '#eab308'; // Yellow
  return '#ef4444'; // Red
}

function renderBar(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return `<div style="color: #64748b; font-style: italic;">Score not available</div>`;
  }
  const color = getRiskScoreColor(score);
  return `
    <div style="background-color: #e2e8f0; border-radius: 999px; height: 20px; width: 100%; max-width: 400px; overflow: hidden; margin-top: 8px;">
      <div style="background-color: ${color}; height: 100%; width: ${Math.min(Math.max(score, 0), 100)}%;"></div>
    </div>
    <div style="margin-top: 4px; font-weight: bold; color: ${color};">${score} / 100</div>
  `;
}

function getActionRecommendations(verdict?: string) {
  const v = (verdict || '').toLowerCase();
  if (v === 'malicious') {
    return `
      <ul>
        <li>Block at firewall/DNS.</li>
        <li>Isolate affected systems.</li>
        <li>Escalate to incident response.</li>
        <li>Preserve logs and check for lateral movement.</li>
      </ul>
    `;
  }
  if (v === 'suspicious') {
    return `
      <ul>
        <li>Monitor closely.</li>
        <li>Do not block yet, run deeper sandbox analysis.</li>
        <li>Check for related IOCs and document findings.</li>
      </ul>
    `;
  }
  if (v === 'clean' || v === 'harmless') {
    return `
      <ul>
        <li>Continue monitoring.</li>
        <li>Re-scan if context changes.</li>
        <li>Whitelist if appropriate.</li>
      </ul>
    `;
  }
  return `
    <ul>
      <li>Try additional intelligence sources.</li>
      <li>Submit for sandbox analysis.</li>
      <li>Treat as suspicious until confirmed.</li>
    </ul>
  `;
}

export function generateAndDownloadReport(data: IOCDetailData) {
  const generatedAt = new Date().toLocaleString();
  const verdictColor = getVerdictColor(data.verdict);
  const type = escapeHTML(data.type || 'Unknown');
  const value = escapeHTML(data.ioc);
  
  // Find a risk score if present anywhere
  let riskScore = data.riskScore;
  if (riskScore === null || riskScore === undefined) {
    if (data.threatIntel?.confidence !== undefined) {
      riskScore = data.threatIntel.confidence;
    }
  }

  // Type specific details
  let technicalDetails = '';
  if (type === 'ip' && data.geolocation) {
    technicalDetails = `
      <h3>IP Information</h3>
      <table class="data-table">
        <tr><th>Country</th><td>${escapeHTML(data.geolocation.country || 'N/A')}</td></tr>
        <tr><th>City</th><td>${escapeHTML(data.geolocation.city || 'N/A')}</td></tr>
        <tr><th>ISP</th><td>${escapeHTML(data.geolocation.isp || 'N/A')}</td></tr>
      </table>
    `;
  } else if (type === 'domain' || data.type === 'domain') {
    // If we have domain info in the future, we can add WHOIS/DNS here
    // But we just output a placeholder or whatever is in data
    technicalDetails = `
      <h3>Domain Information</h3>
      <p>Consult the platform's Domain Intel section for full WHOIS and DNS records.</p>
    `;
  } else if (type === 'hash') {
    const fi = data.fileInfo || {};
    technicalDetails = `
      <h3>File Information</h3>
      <table class="data-table">
        <tr><th>MD5</th><td>${escapeHTML(fi.md5 || 'N/A')}</td></tr>
        <tr><th>SHA1</th><td>${escapeHTML(fi.sha1 || 'N/A')}</td></tr>
        <tr><th>SHA256</th><td>${escapeHTML(fi.sha256 || 'N/A')}</td></tr>
        <tr><th>Size</th><td>${escapeHTML(String(fi.size || 'N/A'))} bytes</td></tr>
      </table>
    `;
  }

  let historicalTimeline = '';
  if (data.threatIntel?.firstSeen || data.threatIntel?.lastSeen) {
    historicalTimeline = `
      <h3>Historical Activity</h3>
      <ul>
        ${data.threatIntel.firstSeen ? `<li><strong>First Seen:</strong> ${escapeHTML(data.threatIntel.firstSeen)}</li>` : ''}
        ${data.threatIntel.lastSeen ? `<li><strong>Last Seen:</strong> ${escapeHTML(data.threatIntel.lastSeen)}</li>` : ''}
      </ul>
    `;
  } else {
    historicalTimeline = `<p>No historical timeline data available.</p>`;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>IOC Intelligence Report - ${value}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
    }
    .page {
      max-width: 800px;
      margin: 40px auto;
      background: #fff;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border-top: 8px solid #0f172a;
    }
    header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo-area {
      font-size: 24px;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 10px;
    }
    h1 {
      font-size: 28px;
      margin: 0 0 10px 0;
      color: #1e293b;
    }
    .meta {
      color: #64748b;
      font-size: 14px;
    }
    h2 {
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
      margin-top: 30px;
    }
    h3 {
      color: #334155;
      margin-top: 20px;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
      color: white;
      text-transform: uppercase;
      font-size: 14px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .data-table th, .data-table td {
      padding: 10px;
      border: 1px solid #e2e8f0;
      text-align: left;
    }
    .data-table th {
      background-color: #f8fafc;
      width: 30%;
      color: #475569;
    }
    .data-table tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
    }
    @media print {
      body { background: #fff; }
      .page { margin: 0; box-shadow: none; border: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="page">
    <header>
      <div class="logo-area">Vigilance Threat Intelligence</div>
      <h1>IOC Intelligence Report</h1>
      <div class="meta">
        <strong>Generated:</strong> ${generatedAt} <br/>
        <strong>Analyst Notes:</strong> _____________________________________________________
      </div>
    </header>

    <h2>Executive Summary</h2>
    <table class="data-table">
      <tr>
        <th>Indicator of Compromise</th>
        <td style="font-family: monospace; font-size: 16px;"><strong>${value}</strong></td>
      </tr>
      <tr>
        <th>Type</th>
        <td style="text-transform: uppercase;">${type}</td>
      </tr>
      <tr>
        <th>Verdict</th>
        <td><span class="badge" style="background-color: ${verdictColor}">${escapeHTML(data.verdict || 'Unknown')}</span></td>
      </tr>
      <tr>
        <th>Data Source</th>
        <td>${escapeHTML(data.metadata?.source || 'History')}</td>
      </tr>
    </table>

    <h2>Risk Score Breakdown</h2>
    <p>Overall threat confidence and risk severity.</p>
    ${renderBar(riskScore)}

    <h2>Threat Classification</h2>
    <ul>
      <li><strong>Severity:</strong> ${escapeHTML(data.threatIntel?.severity || 'N/A')}</li>
      <li><strong>Popular Threat Label:</strong> ${escapeHTML(data.threatIntel?.popularThreatLabel || 'N/A')}</li>
      <li><strong>Categories:</strong> ${(data.threatIntel?.threatCategories || []).map(escapeHTML).join(', ') || 'None'}</li>
    </ul>

    <h2>Technical Details</h2>
    ${technicalDetails || '<p>No specific technical details available for this IOC type.</p>'}

    ${historicalTimeline}

    <h2>Recommended Actions</h2>
    ${getActionRecommendations(data.verdict)}

    <div class="footer">
      CONFIDENTIAL & PROPRIETARY. DO NOT DISTRIBUTE.<br/>
      ThreatLense Platform • Generated ${generatedAt}
    </div>
  </div>
</body>
</html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  const safeIoc = value.replace(/[^a-zA-Z0-9.-]/g, '_');
  a.download = `IOC_Report_${safeIoc}_${dateStr}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
