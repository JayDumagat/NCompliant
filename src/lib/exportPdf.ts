import type { Policy, Assessment, Report } from '@/db/db';
import { openPrintWindow, docCtrl, fmtDate } from './exportStyles';

const RF: Record<string,string> = {none:'—',monthly:'Monthly',quarterly:'Quarterly',semi_annual:'Semi-Annual',annual:'Annual'};

// ─── POLICY EXPORT ───
// Format: Document Control → only user-entered sections, no invented content
export function exportPolicyPDF(p: Policy) {
  const vid = `POL-${p.id.slice(0,8).toUpperCase()}`;
  const ver = p.versions.length > 0 ? p.versions.length : 1;
  const reqs = p.requirements ? p.requirements.split('\n').filter(Boolean) : [];

  const sections: string[] = [];
  let sn = 1;

  // Only include sections where user has entered content
  if (p.purpose) {
    sections.push(`<h2>${sn}. Purpose</h2><div class="pre">${p.purpose}</div>`);
    sn++;
  }
  if (p.scope) {
    sections.push(`<h2>${sn}. Scope</h2><div class="pre">${p.scope}</div>`);
    sn++;
  }
  if (p.content) {
    sections.push(`<h2>${sn}. Policy Statement</h2><div class="pre">${p.content}</div>`);
    sn++;
  }
  if (reqs.length > 0) {
    sections.push(`
      <h2>${sn}. Requirements</h2>
      <table class="dt">
        <thead><tr><th style="width:8%">#</th><th>Requirement</th></tr></thead>
        <tbody>${reqs.map((r,i)=>`<tr><td>${i+1}</td><td>${r.trim()}</td></tr>`).join('')}</tbody>
      </table>
    `);
    sn++;
  }
  if (p.versions.length > 0) {
    sections.push(`
      <h2>${sn}. Revision History</h2>
      <table class="dt">
        <thead><tr><th>Version</th><th>Date</th><th>Description</th></tr></thead>
        <tbody>${p.versions.map(v=>`<tr><td>${v.version}</td><td>${fmtDate(v.updatedAt)}</td><td>${v.note}</td></tr>`).join('')}</tbody>
      </table>
    `);
  }

  const html = `
  <div class="cover">
    <div class="cover-type">${p.category} Policy</div>
    <h1>${p.title}</h1>
    ${docCtrl([
      ['Document ID', vid],
      ['Version', String(ver)],
      ['Status', p.status.replace('_',' ').replace(/\\b\\w/g,c=>c.toUpperCase())],
      ['Owner', p.owner||'—'],
      ['Department', p.department||'—'],
      ['Category', p.category],
      ['Effective Date', fmtDate(p.createdAt)],
      ['Last Updated', fmtDate(p.lastUpdated)],
      ['Review Frequency', RF[p.reviewFrequency]||'—'],
      ['Next Review', p.nextReviewDate ? fmtDate(p.nextReviewDate) : '—'],
      ...(p.tags.length > 0 ? [['Tags', p.tags.join(', ')] as [string,string]] : []),
    ])}
  </div>

  ${sections.join('\n')}

  <h2>Approval</h2>
  <div class="sg">
    <div class="sb"><div class="sl">Prepared By</div><div class="sn">___________________________<br><span style="font-weight:normal;color:#888">Name / Title / Date</span></div></div>
    <div class="sb"><div class="sl">Approved By</div><div class="sn">___________________________<br><span style="font-weight:normal;color:#888">Name / Title / Date</span></div></div>
  </div>
  <div class="ft"><p>${vid} · Version ${ver} · ${fmtDate(Date.now())}</p></div>`;

  openPrintWindow(html);
}

// ─── ASSESSMENT EXPORT ───
// PIA follows NPC PIA Toolkit: Project Description → Threshold Analysis → Data Inventory → Data Flow → Privacy Risk Analysis → Risk Management
// Risk Assessment follows ISO 31000: Scope/Context → Methodology → Risk Register → Treatment
// Security follows ISO 27001: Scope → Controls Checklist → Findings

const PIA_Q: Record<string,string> = {
  q1:'Is explicit consent obtained from data subjects?',
  q2:'Is personal data encrypted at rest and in transit?',
  q3:'Is there a defined data retention and disposal schedule?',
  q4:'Are access controls implemented to limit data exposure?',
  q5:'Has a Data Protection Impact Assessment been conducted?',
  q6:'Are data processing agreements in place with third parties?',
  q7:'Is there a documented breach notification procedure?',
  q8:'Are data subject rights (access, correction, erasure) supported?',
  q9:'Is staff trained on data protection?',
  q10:'Is processing based on a valid legal basis?',
};
const RISK_Q: Record<string,string> = {
  rq1:'Have critical assets been identified and inventoried?',
  rq2:'Has a threat model been documented?',
  rq3:'Is a formal risk register maintained?',
  rq4:'Are risk mitigation controls documented?',
  rq5:'Is there a risk acceptance process?',
  rq6:'Are residual risks monitored and reviewed?',
  rq7:'Is business continuity planning established?',
  rq8:'Are vulnerability assessments conducted?',
};
const SEC_Q: Record<string,string> = {
  sq1:'Are firewalls and network segmentation in place?',
  sq2:'Is multi-factor authentication enforced?',
  sq3:'Are security patches applied within SLA?',
  sq4:'Is endpoint protection deployed?',
  sq5:'Are logs centrally collected and monitored?',
  sq6:'Is there an incident response plan?',
  sq7:'Are backups tested regularly?',
  sq8:'Is physical security adequate?',
  sq9:'Is security awareness training conducted?',
};
const QM: Record<string,Record<string,string>> = {pia:PIA_Q,risk_assessment:RISK_Q,security_checklist:SEC_Q};
const TT: Record<string,string> = {pia:'Privacy Impact Assessment',risk_assessment:'Risk Assessment',security_checklist:'Security Assessment'};
const AL: Record<string,string> = {yes:'Yes',no:'No',partial:'Partial',na:'N/A'};
const AC: Record<string,string> = {yes:'y',no:'n',partial:'p',na:'na'};

export function exportAssessmentPDF(a: Assessment) {
  const qs = QM[a.type]||{};
  const aid = `${a.type==='pia'?'PIA':a.type==='risk_assessment'?'RA':'SA'}-${a.id.slice(0,8).toUpperCase()}`;
  const yc=a.answers.filter(x=>x.answer==='yes').length;
  const nc=a.answers.filter(x=>x.answer==='no').length;
  const pc=a.answers.filter(x=>x.answer==='partial').length;
  const tot=a.answers.length;

  // Build type-specific body
  let body: string | undefined;

  if (a.type === 'pia') {
    // NPC PIA Toolkit format
    body = `
    <h2>1. Project / System Description</h2>
    <table class="dt">
      <tr><td style="width:35%;background:#f0f4f8;font-weight:600">Project Title</td><td>${a.title}</td></tr>
      <tr><td style="background:#f0f4f8;font-weight:600">Description</td><td>${a.description||'—'}</td></tr>
      <tr><td style="background:#f0f4f8;font-weight:600">Data Types Collected</td><td>${a.dataTypes.join(', ')||'—'}</td></tr>
      <tr><td style="background:#f0f4f8;font-weight:600">Purpose of Processing</td><td>${a.processingPurpose||'—'}</td></tr>
      <tr><td style="background:#f0f4f8;font-weight:600">Data Subjects</td><td>${a.dataSubjects||'—'}</td></tr>
    </table>

    <h2>2. Threshold Analysis</h2>
    <p>The following screening determines whether a full PIA is required:</p>
    <table class="dt">
      <thead><tr><th style="width:5%">#</th><th>Screening Question</th><th style="width:12%">Answer</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>Does the project involve collection of personal information?</td><td class="y">Yes</td></tr>
        <tr><td>2</td><td>Does it involve sensitive personal information?</td><td>${a.dataTypes.length>0?'<span class="y">Yes</span>':'<span class="na">TBD</span>'}</td></tr>
        <tr><td>3</td><td>Will information be shared with third parties?</td><td><span class="na">TBD</span></td></tr>
        <tr><td>4</td><td>Does it involve automated decision-making or profiling?</td><td><span class="na">TBD</span></td></tr>
        <tr><td>5</td><td>Is data transferred outside the Philippines?</td><td><span class="na">TBD</span></td></tr>
      </tbody>
    </table>
    <p><strong>Result:</strong> Full PIA is required.</p>

    <h2>3. Personal Data Inventory</h2>
    <table class="dt">
      <thead><tr><th>Data Element</th><th>Category</th><th>Sensitivity</th></tr></thead>
      <tbody>${(a.dataTypes.length>0?a.dataTypes:['-']).map(d=>`<tr><td>${d}</td><td>Personal Information</td><td>To be classified</td></tr>`).join('')}</tbody>
    </table>

    <h2>4. Data Flow</h2>
    <table class="dt">
      <thead><tr><th>Stage</th><th>Description</th><th>Responsible</th></tr></thead>
      <tbody>
        <tr><td>Collection</td><td>How data is gathered from data subjects</td><td>—</td></tr>
        <tr><td>Use / Processing</td><td>${a.processingPurpose||'—'}</td><td>—</td></tr>
        <tr><td>Storage</td><td>Where and how data is stored</td><td>—</td></tr>
        <tr><td>Sharing / Transfer</td><td>Parties data is shared with</td><td>—</td></tr>
        <tr><td>Retention / Disposal</td><td>Retention period and disposal method</td><td>—</td></tr>
      </tbody>
    </table>

    <h2>5. Privacy Risk Analysis</h2>
    <table class="dt">
      <thead><tr><th style="width:5%">#</th><th style="width:50%">Privacy Control</th><th style="width:12%">Status</th><th>Notes</th></tr></thead>
      <tbody>${a.answers.map((ans,i)=>`<tr><td>${i+1}</td><td>${qs[ans.questionId]||ans.questionId}</td><td class="${AC[ans.answer]||''}">${AL[ans.answer]||ans.answer}</td><td>${ans.notes||'—'}</td></tr>`).join('')}</tbody>
    </table>

    <h2>6. Privacy Risk Management</h2>
    ${a.findings?`<h3>6.1 Identified Risks</h3><div class="pre">${a.findings}</div>`:'<p>No risks documented.</p>'}
    ${a.recommendations?`<h3>6.2 Risk Treatment</h3><div class="pre">${a.recommendations}</div>`:''}
    `;
  } else if (a.type === 'risk_assessment') {
    // ISO 31000 format
    body = `
    <h2>1. Scope and Context</h2>
    <table class="dt">
      <tr><td style="width:35%;background:#f0f4f8;font-weight:600">Assessment Title</td><td>${a.title}</td></tr>
      <tr><td style="background:#f0f4f8;font-weight:600">Description</td><td>${a.description||'—'}</td></tr>
      <tr><td style="background:#f0f4f8;font-weight:600">Assets Covered</td><td>${a.assetsCovered||'—'}</td></tr>
      <tr><td style="background:#f0f4f8;font-weight:600">Threat Sources</td><td>${a.threatSources||'—'}</td></tr>
    </table>

    <h2>2. Risk Criteria</h2>
    <table class="mx">
      <tr><th></th><th colspan="5" style="text-align:center">Impact</th></tr>
      <tr><th>Likelihood</th><th>Insignificant</th><th>Minor</th><th>Moderate</th><th>Major</th><th>Catastrophic</th></tr>
      <tr><th>Almost Certain</th><td class="c3">M</td><td class="c4">H</td><td class="c5">C</td><td class="c5">C</td><td class="c5">C</td></tr>
      <tr><th>Likely</th><td class="c2">L</td><td class="c3">M</td><td class="c4">H</td><td class="c5">C</td><td class="c5">C</td></tr>
      <tr><th>Possible</th><td class="c1">L</td><td class="c2">L</td><td class="c3">M</td><td class="c4">H</td><td class="c5">C</td></tr>
      <tr><th>Unlikely</th><td class="c1">L</td><td class="c1">L</td><td class="c2">L</td><td class="c3">M</td><td class="c4">H</td></tr>
      <tr><th>Rare</th><td class="c1">L</td><td class="c1">L</td><td class="c2">L</td><td class="c2">L</td><td class="c3">M</td></tr>
    </table>
    <p style="font-size:10px;color:#888">L = Low | M = Medium | H = High | C = Critical</p>

    <h2>3. Risk Register</h2>
    <table class="dt">
      <thead><tr><th style="width:5%">#</th><th style="width:45%">Risk Area</th><th style="width:12%">Status</th><th>Notes / Existing Controls</th></tr></thead>
      <tbody>${a.answers.map((ans,i)=>`<tr><td>${i+1}</td><td>${qs[ans.questionId]||ans.questionId}</td><td class="${AC[ans.answer]||''}">${AL[ans.answer]||ans.answer}</td><td>${ans.notes||'—'}</td></tr>`).join('')}</tbody>
    </table>

    <h2>4. Risk Treatment Plan</h2>
    ${a.findings?`<h3>4.1 Findings</h3><div class="pre">${a.findings}</div>`:'<p>No findings documented.</p>'}
    ${a.recommendations?`<h3>4.2 Treatment Actions</h3><div class="pre">${a.recommendations}</div>`:''}
    `;
  } else {
    // Security Assessment — ISO 27001 Annex A format
    body = `
    <h2>1. Audit Scope</h2>
    <table class="dt">
      <tr><td style="width:35%;background:#f0f4f8;font-weight:600">Assessment Title</td><td>${a.title}</td></tr>
      <tr><td style="background:#f0f4f8;font-weight:600">Description</td><td>${a.description||'—'}</td></tr>
      <tr><td style="background:#f0f4f8;font-weight:600">Systems in Scope</td><td>${a.systemsInScope||'—'}</td></tr>
      <tr><td style="background:#f0f4f8;font-weight:600">Framework</td><td>${a.frameworkRef||'—'}</td></tr>
      <tr><td style="background:#f0f4f8;font-weight:600">Period</td><td>${fmtDate(a.createdAt)} — ${a.completedAt?fmtDate(a.completedAt):'Ongoing'}</td></tr>
    </table>

    <h2>2. Controls Checklist</h2>
    <table class="dt">
      <thead><tr><th style="width:5%">#</th><th style="width:50%">Control</th><th style="width:12%">Status</th><th>Evidence / Notes</th></tr></thead>
      <tbody>${a.answers.map((ans,i)=>`<tr><td>${i+1}</td><td>${qs[ans.questionId]||ans.questionId}</td><td class="${AC[ans.answer]||''}">${AL[ans.answer]||ans.answer}</td><td>${ans.notes||'—'}</td></tr>`).join('')}</tbody>
    </table>

    <h2>3. Findings</h2>
    ${a.findings?`<div class="pre">${a.findings}</div>`:'<p>No findings documented.</p>'}
    ${a.recommendations?`<h2>4. Recommendations</h2><div class="pre">${a.recommendations}</div>`:''}
    `;
  }

  // Summary section (common to all)
  const summary = `
    <h2>Summary</h2>
    <table class="dt">
      <thead><tr><th>Metric</th><th>Value</th></tr></thead>
      <tbody>
        <tr><td>Total Controls Assessed</td><td>${tot}</td></tr>
        <tr><td>Compliant</td><td class="y">${yc} (${tot?Math.round(yc/tot*100):0}%)</td></tr>
        <tr><td>Partial</td><td class="p">${pc} (${tot?Math.round(pc/tot*100):0}%)</td></tr>
        <tr><td>Non-Compliant</td><td class="n">${nc} (${tot?Math.round(nc/tot*100):0}%)</td></tr>
        <tr><td>Overall Score</td><td><strong>${a.score}%</strong></td></tr>
        <tr><td>Risk Level</td><td><span class="rb ${a.riskLevel==='high'?'rh':a.riskLevel==='medium'?'rm':'rl'}">${a.riskLevel.toUpperCase()}</span></td></tr>
      </tbody>
    </table>
  `;

  body ??= '<p>No assessment details available.</p>';

  const html = `
  <div class="cover">
    <div class="cover-type">${TT[a.type]||'Assessment'}</div>
    <h1>${a.title}</h1>
    <div class="cover-sub">${a.description}</div>
    ${docCtrl([
      ['Document ID', aid],
      ['Type', TT[a.type]||a.type],
      ['Status', a.status.replace('_',' ').replace(/\\b\\w/g,c=>c.toUpperCase())],
      ['Score', `${a.score}% — ${a.riskLevel.toUpperCase()}`],
      ['Created', fmtDate(a.createdAt)],
      ['Completed', a.completedAt?fmtDate(a.completedAt):'In Progress'],
    ])}
  </div>

  ${body}
  ${summary}

  ${a.versions.length>0?`
  <h2>Revision History</h2>
  <table class="dt">
    <thead><tr><th>Version</th><th>Score</th><th>Risk</th><th>Date</th><th>Notes</th></tr></thead>
    <tbody>${a.versions.map(v=>`<tr><td>${v.version}</td><td>${v.score}%</td><td>${v.riskLevel}</td><td>${fmtDate(v.completedAt)}</td><td>${v.note}</td></tr>`).join('')}</tbody>
  </table>`:''}

  <h2>Approval</h2>
  <div class="sg">
    <div class="sb"><div class="sl">Assessed By</div><div class="sn">___________________________<br><span style="font-weight:normal;color:#888">Name / Title / Date</span></div></div>
    <div class="sb"><div class="sl">Reviewed By</div><div class="sn">___________________________<br><span style="font-weight:normal;color:#888">Name / Title / Date</span></div></div>
  </div>
  <div class="ft"><p>${aid} · ${fmtDate(Date.now())}</p></div>`;

  openPrintWindow(html);
}

// ─── REPORT EXPORT ───
const TPL_L: Record<string,string> = { compliance_summary:'Compliance Summary', risk_assessment:'Risk Assessment', training_compliance:'Training Compliance', incident_summary:'Incident Summary', regulatory_submission:'Regulatory Submission' };

export function exportReportPDF(r: Report) {
  const d = r.data;
  const policyPct = d.totalPolicies > 0 ? Math.round((d.activePolicies / d.totalPolicies) * 100) : 0;
  const taskPct = d.totalTasks > 0 ? Math.round((d.completedTasks / d.totalTasks) * 100) : 0;
  const assessPct = d.totalAssessments > 0 ? Math.round((d.completedAssessments / d.totalAssessments) * 100) : 0;

  function bar(val: number, max: number, color: string) {
    const pct = max > 0 ? Math.round((val/max)*100) : 0;
    return `<div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:14px;background:#f0f4f8;border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${color};border-radius:4px"></div></div><span style="font-size:10px;font-weight:600;width:40px;text-align:right">${val}/${max}</span></div>`;
  }

  const html = `
  <div class="cover">
    <div class="cover-type">${TPL_L[r.template]||'Compliance Report'}</div>
    <h1>${r.title}</h1>
    ${docCtrl([
      ['Report Type', r.type === 'regulatory' ? 'Regulatory Submission' : 'Internal Report'],
      ['Period', r.period.charAt(0).toUpperCase()+r.period.slice(1)],
      ['Status', r.status.charAt(0).toUpperCase()+r.status.slice(1)],
      ['Generated', fmtDate(r.generatedAt)],
    ])}
  </div>

  <h2>1. Compliance Overview</h2>
  <table class="dt">
    <thead><tr><th>Area</th><th>Score</th><th>Detail</th></tr></thead>
    <tbody>
      <tr><td>Policy Coverage</td><td><strong>${policyPct}%</strong></td><td>${d.activePolicies} of ${d.totalPolicies} policies active</td></tr>
      <tr><td>Task Completion</td><td><strong>${taskPct}%</strong></td><td>${d.completedTasks} of ${d.totalTasks} tasks completed</td></tr>
      <tr><td>Assessment Completion</td><td><strong>${assessPct}%</strong></td><td>${d.completedAssessments} of ${d.totalAssessments} assessments completed</td></tr>
      <tr><td>Training Compliance</td><td><strong>${d.trainingCompliance}%</strong></td><td>Staff certification rate</td></tr>
    </tbody>
  </table>

  <h2>2. Progress</h2>
  <div style="display:grid;gap:10px;margin:12px 0">
    <div><div style="font-size:10px;color:#666;margin-bottom:3px">Policies</div>${bar(d.activePolicies, d.totalPolicies, '#001F3F')}</div>
    <div><div style="font-size:10px;color:#666;margin-bottom:3px">Tasks</div>${bar(d.completedTasks, d.totalTasks, '#059669')}</div>
    <div><div style="font-size:10px;color:#666;margin-bottom:3px">Assessments</div>${bar(d.completedAssessments, d.totalAssessments, '#d97706')}</div>
  </div>

  <h2>3. Risk Alerts</h2>
  <table class="dt">
    <thead><tr><th>Alert</th><th>Count</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td>Overdue Tasks</td><td>${d.overdueTasks}</td><td>${d.overdueTasks > 0 ? '<span class="n">Action Required</span>' : '<span class="y">Clear</span>'}</td></tr>
      <tr><td>Open Incidents</td><td>${d.openIncidents}</td><td>${d.openIncidents > 0 ? '<span class="n">Active</span>' : '<span class="y">Clear</span>'}</td></tr>
      <tr><td>High Risk Assessments</td><td>${d.highRiskAssessments}</td><td>${d.highRiskAssessments > 0 ? '<span class="p">Monitor</span>' : '<span class="y">Clear</span>'}</td></tr>
    </tbody>
  </table>

  ${r.notes ? `<h2>4. Notes</h2><div class="pre">${r.notes}</div>` : ''}

  <h2>Approval</h2>
  <div class="sg">
    <div class="sb"><div class="sl">Prepared By</div><div class="sn">___________________________<br><span style="font-weight:normal;color:#888">Name / Title / Date</span></div></div>
    <div class="sb"><div class="sl">Reviewed By</div><div class="sn">___________________________<br><span style="font-weight:normal;color:#888">Name / Title / Date</span></div></div>
  </div>
  <div class="ft"><p>${r.title} · ${fmtDate(r.generatedAt)}</p></div>`;

  openPrintWindow(html);
}
