import Dexie, { type EntityTable } from 'dexie';

export interface Workspace {
  id: string;
  name: string;
  createdAt: number;
}

export interface Policy {
  id: string;
  workspaceId: string;
  title: string;
  status: 'draft' | 'active' | 'under_review' | 'archived';
  content: string;
  category: string;
  owner: string;
  department: string;
  purpose: string;
  scope: string;
  requirements: string;
  reviewFrequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'none';
  nextReviewDate?: number;
  lastUpdated: number;
  createdAt: number;
  tags: string[];
  versions: PolicyVersion[];
}

export interface PolicyVersion {
  version: number;
  content: string;
  updatedAt: number;
  note: string;
}

export interface Task {
  id: string;
  workspaceId: string;
  policyId?: string;
  assessmentId?: string;
  title: string;
  description: string;
  assignedTo: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: number;
  createdAt: number;
}

export interface RegulatoryUpdate {
  id: string;
  title: string;
  agency: string;
  date: number;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  affectedPolicies: string[];
  actions: string[];
}

export type AssessmentType = 'pia' | 'risk_assessment' | 'security_checklist';

export interface AssessmentAnswer {
  questionId: string;
  answer: 'yes' | 'no' | 'partial' | 'na';
  notes: string;
}

export interface Assessment {
  id: string;
  workspaceId: string;
  type: AssessmentType;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  riskLevel: 'low' | 'medium' | 'high' | 'unassessed';
  // PIA-specific
  dataTypes: string[];
  processingPurpose: string;
  dataSubjects: string;
  // Risk Assessment-specific
  assetsCovered: string;
  threatSources: string;
  // Security Checklist-specific
  systemsInScope: string;
  frameworkRef: string;
  // Shared
  answers: AssessmentAnswer[];
  findings: string;
  recommendations: string;
  score: number;
  createdAt: number;
  completedAt?: number;
  versions: AssessmentVersion[];
}

export interface AssessmentVersion {
  version: number;
  score: number;
  riskLevel: Assessment['riskLevel'];
  completedAt: number;
  note: string;
  findings?: string;
  recommendations?: string;
  answers?: AssessmentAnswer[];
}

// --- New entity types ---

export interface TemplateStep {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskTemplate {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  category: 'audit' | 'policy_review' | 'pia' | 'incident' | 'training' | 'report' | 'custom';
  steps: TemplateStep[];
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: number;
  notes?: string;
}

export interface Checklist {
  id: string;
  workspaceId: string;
  title: string;
  type: 'audit' | 'incident' | 'training' | 'policy_adherence' | 'custom';
  items: ChecklistItem[];
  linkedPolicyId?: string;
  linkedAssessmentId?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  createdAt: number;
  completedAt?: number;
}

export interface TrainingRecord {
  id: string;
  workspaceId: string;
  employeeName: string;
  courseName: string;
  category: 'privacy' | 'security' | 'compliance' | 'aml' | 'general';
  status: 'scheduled' | 'in_progress' | 'completed' | 'expired';
  scheduledDate?: number;
  completedDate?: number;
  expirationDate?: number;
  certificateRef: string;
  notes: string;
  createdAt: number;
}

export interface Incident {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  type: 'data_breach' | 'security' | 'compliance_violation' | 'operational' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  reportedBy: string;
  reportedDate: number;
  resolvedDate?: number;
  linkedPolicies: string[];
  linkedAssessments: string[];
  linkedTasks: string[];
  findings: string;
  mitigationSteps: string;
  isRecurring: boolean;
  createdAt: number;
}

export interface ReportSnapshot {
  totalPolicies: number;
  activePolicies: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalAssessments: number;
  completedAssessments: number;
  highRiskAssessments: number;
  openIncidents: number;
  trainingCompliance: number;
}

export interface Report {
  id: string;
  workspaceId: string;
  title: string;
  type: 'internal' | 'regulatory';
  template: 'compliance_summary' | 'risk_assessment' | 'training_compliance' | 'incident_summary' | 'regulatory_submission';
  period: 'monthly' | 'quarterly' | 'annual' | 'custom';
  periodStart?: number;
  periodEnd?: number;
  data: ReportSnapshot;
  notes: string;
  status: 'draft' | 'final';
  generatedAt: number;
}

// Keep legacy PIA types for backward compat during migration
export interface PIAAnswer {
  questionId: string;
  answer: 'yes' | 'no' | 'partial' | 'na';
  notes: string;
}

export interface PIA {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  riskLevel: 'low' | 'medium' | 'high' | 'unassessed';
  dataTypes: string[];
  processingPurpose: string;
  dataSubjects: string;
  answers: PIAAnswer[];
  score: number;
  createdAt: number;
  completedAt?: number;
}

const db = new Dexie('NCompliantDB') as Dexie & {
  workspaces: EntityTable<Workspace, 'id'>;
  policies: EntityTable<Policy, 'id'>;
  tasks: EntityTable<Task, 'id'>;
  updates: EntityTable<RegulatoryUpdate, 'id'>;
  pias: EntityTable<PIA, 'id'>;
  assessments: EntityTable<Assessment, 'id'>;
  taskTemplates: EntityTable<TaskTemplate, 'id'>;
  checklists: EntityTable<Checklist, 'id'>;
  trainingRecords: EntityTable<TrainingRecord, 'id'>;
  incidents: EntityTable<Incident, 'id'>;
  reports: EntityTable<Report, 'id'>;
};

db.version(3).stores({
  workspaces: 'id, name',
  policies: 'id, workspaceId, status, category, lastUpdated',
  tasks: 'id, workspaceId, policyId, status, priority, dueDate',
  updates: 'id, agency, severity, date',
  pias: 'id, workspaceId, status, riskLevel, createdAt',
});

db.version(4).stores({
  workspaces: 'id, name',
  policies: 'id, workspaceId, status, category, lastUpdated',
  tasks: 'id, workspaceId, policyId, assessmentId, status, priority, dueDate',
  updates: 'id, agency, severity, date',
  pias: 'id, workspaceId, status, riskLevel, createdAt',
  assessments: 'id, workspaceId, type, status, riskLevel, createdAt',
}).upgrade(async (tx) => {
  const pias = await tx.table('pias').toArray();
  const assessments = pias.map((p: PIA): Assessment => ({
    id: p.id, workspaceId: p.workspaceId, type: 'pia', title: p.title, description: p.description,
    status: p.status, riskLevel: p.riskLevel, dataTypes: p.dataTypes, processingPurpose: p.processingPurpose,
    dataSubjects: p.dataSubjects, assetsCovered: '', threatSources: '', systemsInScope: '', frameworkRef: '',
    answers: p.answers, findings: '', recommendations: '', score: p.score, createdAt: p.createdAt,
    completedAt: p.completedAt, versions: [],
  }));
  await tx.table('assessments').bulkAdd(assessments);
  await tx.table('policies').toCollection().modify((p: Policy) => {
    if (!p.department) p.department = '';
    if (!p.purpose) p.purpose = '';
    if (!p.scope) p.scope = '';
    if (!p.requirements) p.requirements = '';
    if (!p.reviewFrequency) p.reviewFrequency = 'none';
  });
  await tx.table('tasks').toCollection().modify((t: Task) => {
    if (!t.assignedTo) t.assignedTo = '';
  });
});

db.version(5).stores({
  workspaces: 'id, name',
  policies: 'id, workspaceId, status, category, lastUpdated',
  tasks: 'id, workspaceId, policyId, assessmentId, status, priority, dueDate',
  updates: 'id, agency, severity, date',
  pias: 'id, workspaceId, status, riskLevel, createdAt',
  assessments: 'id, workspaceId, type, status, riskLevel, createdAt',
  taskTemplates: 'id, workspaceId, category, createdAt',
  checklists: 'id, workspaceId, type, status, createdAt',
  trainingRecords: 'id, workspaceId, status, category, expirationDate, createdAt',
  incidents: 'id, workspaceId, type, severity, status, reportedDate, createdAt',
  reports: 'id, workspaceId, type, template, period, status, generatedAt',
});

export async function seedDatabase() {
  const count = await db.policies.count();
  if (count > 0) return;

  const ws = 'ws-default';
  const now = Date.now();
  const d = 86400000;

  await db.workspaces.add({ id: ws, name: 'Default Workspace', createdAt: now });

  await db.policies.bulkAdd([
    {
      id: 'pol-001', workspaceId: ws, title: 'Data Privacy Policy', status: 'active', category: 'Privacy',
      owner: 'Compliance Team', department: 'Legal', purpose: 'Ensure compliance with the Data Privacy Act of 2012 (RA 10173) and protect personal information of data subjects.',
      scope: 'All employees, contractors, and third-party processors handling personal data.',
      requirements: 'Obtain explicit consent before processing personal data\nImplement appropriate security measures\nReport data breaches within 72 hours\nAppoint a Data Protection Officer',
      reviewFrequency: 'quarterly', nextReviewDate: now + 60 * d,
      lastUpdated: now - 2 * d, createdAt: now - 90 * d, tags: ['privacy', 'DPA', 'NPC'],
      content: 'This policy outlines how personal data is collected, processed, stored, and protected in accordance with the Data Privacy Act of 2012 (RA 10173).\n\nScope: All employees, contractors, and third-party processors.\n\nKey Requirements:\n- Obtain explicit consent before processing personal data\n- Implement appropriate security measures\n- Report data breaches within 72 hours\n- Appoint a Data Protection Officer',
      versions: [
        { version: 1, content: 'Initial draft', updatedAt: now - 90 * d, note: 'Initial version' },
        { version: 2, content: 'Updated breach notification', updatedAt: now - 30 * d, note: 'Updated per NPC advisory' },
      ],
    },
    {
      id: 'pol-002', workspaceId: ws, title: 'Information Security Policy', status: 'active', category: 'Security',
      owner: 'IT Department', department: 'IT', purpose: 'Establish framework for protecting information assets from unauthorized access, disclosure, modification, and destruction.',
      scope: 'All information systems and digital assets.',
      requirements: 'Access control and authentication\nEncryption standards\nIncident response procedures\nRegular security assessments',
      reviewFrequency: 'semi_annual', nextReviewDate: now + 120 * d,
      lastUpdated: now - 5 * d, createdAt: now - 180 * d, tags: ['security', 'infosec', 'ISO27001'],
      content: 'This policy establishes the framework for protecting information assets from unauthorized access, disclosure, modification, and destruction.\n\nScope: All information systems and digital assets.\n\nKey Controls:\n- Access control and authentication\n- Encryption standards\n- Incident response procedures\n- Regular security assessments',
      versions: [{ version: 1, content: 'Initial draft', updatedAt: now - 180 * d, note: 'Initial version' }],
    },
    {
      id: 'pol-003', workspaceId: ws, title: 'Acceptable Use Policy', status: 'under_review', category: 'Operations',
      owner: 'HR Department', department: 'HR', purpose: 'Define acceptable use of company IT resources to maintain security and productivity.',
      scope: 'All employees and authorized users.',
      requirements: 'No unauthorized software installation\nNo accessing inappropriate content\nNo sharing credentials',
      reviewFrequency: 'annual', nextReviewDate: now + 30 * d,
      lastUpdated: now - 1 * d, createdAt: now - 60 * d, tags: ['operations', 'HR', 'IT'],
      content: 'This policy defines the acceptable use of company IT resources.\n\nScope: All employees and authorized users.\n\nProhibited Activities:\n- Unauthorized software installation\n- Accessing inappropriate content\n- Sharing credentials',
      versions: [{ version: 1, content: 'Initial draft', updatedAt: now - 60 * d, note: 'Initial version' }],
    },
    {
      id: 'pol-004', workspaceId: ws, title: 'Business Continuity Plan', status: 'draft', category: 'Risk Management',
      owner: 'Operations', department: 'Operations', purpose: 'Outline procedures for maintaining essential business functions during and after a disaster.',
      scope: 'All critical business operations and supporting infrastructure.',
      requirements: 'Business impact analysis\nRecovery time objectives\nCommunication plan\nTesting schedule',
      reviewFrequency: 'annual', nextReviewDate: now + 90 * d,
      lastUpdated: now - 10 * d, createdAt: now - 15 * d, tags: ['BCP', 'disaster-recovery'],
      content: 'This document outlines procedures for maintaining essential business functions during and after a disaster or significant disruption.',
      versions: [],
    },
    {
      id: 'pol-005', workspaceId: ws, title: 'Anti-Money Laundering Policy', status: 'active', category: 'Compliance',
      owner: 'Legal Department', department: 'Legal', purpose: 'Establish procedures to detect and prevent money laundering activities.',
      scope: 'All financial transactions and customer relationships.',
      requirements: 'Know Your Customer (KYC) procedures\nTransaction monitoring\nSuspicious activity reporting\nRecord keeping',
      reviewFrequency: 'quarterly', nextReviewDate: now + 45 * d,
      lastUpdated: now - 20 * d, createdAt: now - 365 * d, tags: ['AML', 'AMLC'],
      content: 'This policy establishes procedures to detect and prevent money laundering activities in compliance with the Anti-Money Laundering Act.',
      versions: [
        { version: 1, content: 'Initial draft', updatedAt: now - 365 * d, note: 'Initial version' },
        { version: 2, content: 'Updated KYC', updatedAt: now - 200 * d, note: 'Enhanced due diligence' },
        { version: 3, content: 'Current version', updatedAt: now - 20 * d, note: 'Annual review update' },
      ],
    },
    {
      id: 'pol-006', workspaceId: ws, title: 'Data Retention Policy', status: 'active', category: 'Privacy',
      owner: 'Compliance Team', department: 'Legal', purpose: 'Define retention periods for various categories of data and procedures for secure disposal.',
      scope: 'All data stored in physical and digital formats.',
      requirements: 'Retention schedule by data category\nSecure disposal procedures\nAudit trail\nException handling',
      reviewFrequency: 'annual', nextReviewDate: now + 180 * d,
      lastUpdated: now - 45 * d, createdAt: now - 200 * d, tags: ['retention', 'privacy'],
      content: 'This policy defines the retention periods for various categories of data and the procedures for secure disposal.',
      versions: [{ version: 1, content: 'Initial draft', updatedAt: now - 200 * d, note: 'Initial version' }],
    },
  ]);

  await db.tasks.bulkAdd([
    { id: 'task-001', workspaceId: ws, policyId: 'pol-003', title: 'Review AUP updates', description: 'Review the latest amendments to the AUP.', assignedTo: 'Jane Cruz', status: 'in_progress', priority: 'high', dueDate: now + 2 * d, createdAt: now - 3 * d },
    { id: 'task-002', workspaceId: ws, policyId: 'pol-004', title: 'Complete BCP draft', description: 'Finalize the first draft of the BCP.', assignedTo: 'Mark Santos', status: 'todo', priority: 'high', dueDate: now + 5 * d, createdAt: now - 7 * d },
    { id: 'task-003', workspaceId: ws, policyId: 'pol-001', title: 'Annual DPA compliance review', description: 'Conduct annual review of DPA compliance.', assignedTo: 'Ana Reyes', status: 'todo', priority: 'medium', dueDate: now + 14 * d, createdAt: now - 1 * d },
    { id: 'task-004', workspaceId: ws, policyId: 'pol-002', title: 'Update incident response plan', description: 'Revise incident response procedures.', assignedTo: 'Mark Santos', status: 'done', priority: 'medium', dueDate: now - 2 * d, createdAt: now - 14 * d },
    { id: 'task-005', workspaceId: ws, title: 'Schedule Q2 compliance training', description: 'Organize mandatory compliance training sessions.', assignedTo: 'HR Team', status: 'todo', priority: 'low', dueDate: now + 30 * d, createdAt: now - 5 * d },
    { id: 'task-006', workspaceId: ws, policyId: 'pol-005', title: 'Submit AML quarterly report', description: 'Prepare and submit the quarterly AML report.', assignedTo: 'Legal Team', status: 'todo', priority: 'high', dueDate: now - 1 * d, createdAt: now - 10 * d },
  ]);

  await db.updates.bulkAdd([
    { id: 'upd-001', title: 'NPC Circular 2024-01: Enhanced Data Subject Rights', agency: 'NPC', date: now - 5 * d, description: 'New guidelines requiring data subject requests to be processed within 15 business days.', severity: 'critical', affectedPolicies: ['pol-001'], actions: ['Update data subject request procedures', 'Train staff on new timelines'] },
    { id: 'upd-002', title: 'SEC Memo No. 5: Cybersecurity Framework', agency: 'SEC', date: now - 15 * d, description: 'Mandatory NIST cybersecurity framework adoption for registered corporations.', severity: 'warning', affectedPolicies: ['pol-002'], actions: ['Assess security posture against NIST', 'Submit compliance plan'] },
    { id: 'upd-003', title: 'DICT Cloud First Policy v2', agency: 'DICT', date: now - 30 * d, description: 'Updated cloud deployment guidelines emphasizing local data residency.', severity: 'info', affectedPolicies: ['pol-002'], actions: ['Review cloud hosting', 'Verify data residency'] },
    { id: 'upd-004', title: 'AMLC Advisory on VASPs', agency: 'AMLC', date: now - 45 * d, description: 'New registration and reporting requirements for virtual asset service providers.', severity: 'warning', affectedPolicies: ['pol-005'], actions: ['Review VASP exposure', 'Update KYC for digital assets'] },
  ]);

  await db.assessments.bulkAdd([
    {
      id: 'asm-001', workspaceId: ws, type: 'pia', title: 'Customer Onboarding System', description: 'Assessment of the new digital customer onboarding flow.',
      status: 'completed', riskLevel: 'medium', dataTypes: ['Personal Information', 'Financial Data', 'Government IDs'],
      processingPurpose: 'Customer identity verification and account creation', dataSubjects: 'New customers and applicants',
      assetsCovered: '', threatSources: '', systemsInScope: '', frameworkRef: '',
      score: 72, createdAt: now - 60 * d, completedAt: now - 30 * d, findings: 'Data retention policies require updating. DPIA not yet conducted for expanded processing.', recommendations: 'Update retention schedule. Conduct full DPIA. Enhance encryption for ID documents.',
      answers: [
        { questionId: 'q1', answer: 'yes', notes: 'Consent form implemented' },
        { questionId: 'q2', answer: 'yes', notes: 'AES-256 encryption' },
        { questionId: 'q3', answer: 'partial', notes: 'Retention policy needs update' },
        { questionId: 'q4', answer: 'yes', notes: 'Access controls in place' },
        { questionId: 'q5', answer: 'no', notes: 'No DPIA conducted yet' },
      ],
      versions: [{ version: 1, score: 72, riskLevel: 'medium', completedAt: now - 30 * d, note: 'Initial assessment completed' }],
    },
    {
      id: 'asm-002', workspaceId: ws, type: 'pia', title: 'Employee Monitoring System', description: 'Assessment of workplace activity monitoring tools.',
      status: 'in_progress', riskLevel: 'high', dataTypes: ['Employee Activity Data', 'Communications', 'Location Data'],
      processingPurpose: 'Productivity monitoring and security compliance', dataSubjects: 'All employees',
      assetsCovered: '', threatSources: '', systemsInScope: '', frameworkRef: '',
      score: 45, createdAt: now - 14 * d, findings: '', recommendations: '',
      answers: [
        { questionId: 'q1', answer: 'partial', notes: 'Need to update consent' },
        { questionId: 'q2', answer: 'yes', notes: '' },
        { questionId: 'q3', answer: 'no', notes: '' },
      ],
      versions: [],
    },
    {
      id: 'asm-003', workspaceId: ws, type: 'pia', title: 'Marketing Analytics Platform', description: 'Assessment of third-party analytics tools usage.',
      status: 'not_started', riskLevel: 'unassessed', dataTypes: ['Browsing Data', 'Demographics'],
      processingPurpose: 'Campaign effectiveness analysis', dataSubjects: 'Website visitors',
      assetsCovered: '', threatSources: '', systemsInScope: '', frameworkRef: '',
      score: 0, createdAt: now - 3 * d, findings: '', recommendations: '',
      answers: [], versions: [],
    },
    {
      id: 'asm-004', workspaceId: ws, type: 'risk_assessment', title: 'Cloud Infrastructure Risk Review', description: 'Evaluate risks associated with cloud migration.',
      status: 'in_progress', riskLevel: 'medium', dataTypes: [],
      processingPurpose: '', dataSubjects: '',
      assetsCovered: 'AWS EC2, S3, RDS instances', threatSources: 'External actors, misconfigurations, insider threats',
      systemsInScope: '', frameworkRef: '',
      score: 55, createdAt: now - 20 * d, findings: 'IAM policies need tightening. S3 buckets have overly permissive ACLs.', recommendations: 'Implement least-privilege IAM. Enable S3 bucket policies. Add CloudTrail logging.',
      answers: [
        { questionId: 'rq1', answer: 'partial', notes: 'Some assets inventoried' },
        { questionId: 'rq2', answer: 'yes', notes: 'Threat model documented' },
        { questionId: 'rq3', answer: 'no', notes: 'No formal risk register' },
      ],
      versions: [],
    },
    {
      id: 'asm-005', workspaceId: ws, type: 'security_checklist', title: 'ISO 27001 Controls Review', description: 'Annual security controls checklist aligned with ISO 27001.',
      status: 'not_started', riskLevel: 'unassessed', dataTypes: [],
      processingPurpose: '', dataSubjects: '',
      assetsCovered: '', threatSources: '',
      systemsInScope: 'All production servers, network infrastructure', frameworkRef: 'ISO/IEC 27001:2022',
      score: 0, createdAt: now - 5 * d, findings: '', recommendations: '',
      answers: [], versions: [],
    },
  ]);

  await db.taskTemplates.bulkAdd([
    { id: 'tpl-001', workspaceId: ws, title: 'Quarterly Policy Review', description: 'Standard review cycle for active policies.', category: 'policy_review', priority: 'high', recurrence: 'quarterly', createdAt: now - 30 * d, steps: [
      { id: 's1', text: 'Review policy content for accuracy', completed: false },
      { id: 's2', text: 'Check regulatory alignment', completed: false },
      { id: 's3', text: 'Update references and citations', completed: false },
      { id: 's4', text: 'Obtain stakeholder sign-off', completed: false },
      { id: 's5', text: 'Publish updated version', completed: false },
    ]},
    { id: 'tpl-002', workspaceId: ws, title: 'Data Breach Response', description: 'Incident response checklist for data breaches.', category: 'incident', priority: 'high', createdAt: now - 20 * d, steps: [
      { id: 's1', text: 'Contain the breach', completed: false },
      { id: 's2', text: 'Assess scope and impact', completed: false },
      { id: 's3', text: 'Notify DPO within 24 hours', completed: false },
      { id: 's4', text: 'Report to NPC within 72 hours', completed: false },
      { id: 's5', text: 'Notify affected data subjects', completed: false },
      { id: 's6', text: 'Document findings and remediation', completed: false },
    ]},
    { id: 'tpl-003', workspaceId: ws, title: 'Annual Compliance Audit', description: 'Full compliance audit template.', category: 'audit', priority: 'high', recurrence: 'annual', createdAt: now - 10 * d, steps: [
      { id: 's1', text: 'Define audit scope and objectives', completed: false },
      { id: 's2', text: 'Collect evidence and documentation', completed: false },
      { id: 's3', text: 'Interview key personnel', completed: false },
      { id: 's4', text: 'Identify findings and gaps', completed: false },
      { id: 's5', text: 'Draft audit report', completed: false },
      { id: 's6', text: 'Present to management', completed: false },
      { id: 's7', text: 'Create remediation plan', completed: false },
    ]},
    { id: 'tpl-004', workspaceId: ws, title: 'Monthly Training Check', description: 'Verify training compliance monthly.', category: 'training', priority: 'medium', recurrence: 'monthly', createdAt: now - 5 * d, steps: [
      { id: 's1', text: 'Review training completion rates', completed: false },
      { id: 's2', text: 'Identify overdue employees', completed: false },
      { id: 's3', text: 'Send reminder notifications', completed: false },
      { id: 's4', text: 'Update training records', completed: false },
    ]},
  ]);

  await db.checklists.bulkAdd([
    { id: 'cl-001', workspaceId: ws, title: 'Q2 Privacy Audit Checklist', type: 'audit', linkedPolicyId: 'pol-001', status: 'in_progress', createdAt: now - 7 * d, items: [
      { id: 'i1', text: 'Verify consent mechanisms are functional', completed: true, completedBy: 'Ana Reyes', completedAt: now - 5 * d },
      { id: 'i2', text: 'Review data processing agreements', completed: true, completedBy: 'Ana Reyes', completedAt: now - 4 * d },
      { id: 'i3', text: 'Check data subject request logs', completed: false },
      { id: 'i4', text: 'Validate encryption standards', completed: false },
      { id: 'i5', text: 'Audit access control logs', completed: false },
    ]},
    { id: 'cl-002', workspaceId: ws, title: 'New Employee Security Onboarding', type: 'training', status: 'completed', createdAt: now - 14 * d, completedAt: now - 10 * d, items: [
      { id: 'i1', text: 'Complete security awareness training', completed: true, completedBy: 'HR Team', completedAt: now - 12 * d },
      { id: 'i2', text: 'Sign acceptable use policy', completed: true, completedBy: 'HR Team', completedAt: now - 11 * d },
      { id: 'i3', text: 'Set up MFA on all accounts', completed: true, completedBy: 'IT Team', completedAt: now - 10 * d },
    ]},
  ]);

  await db.trainingRecords.bulkAdd([
    { id: 'tr-001', workspaceId: ws, employeeName: 'Ana Reyes', courseName: 'Data Privacy Act Fundamentals', category: 'privacy', status: 'completed', scheduledDate: now - 60 * d, completedDate: now - 55 * d, expirationDate: now + 305 * d, certificateRef: 'DPA-2024-001', notes: '', createdAt: now - 60 * d },
    { id: 'tr-002', workspaceId: ws, employeeName: 'Mark Santos', courseName: 'Information Security Basics', category: 'security', status: 'completed', scheduledDate: now - 45 * d, completedDate: now - 40 * d, expirationDate: now + 320 * d, certificateRef: 'SEC-2024-015', notes: '', createdAt: now - 45 * d },
    { id: 'tr-003', workspaceId: ws, employeeName: 'Jane Cruz', courseName: 'Anti-Money Laundering Training', category: 'aml', status: 'in_progress', scheduledDate: now - 5 * d, expirationDate: now + 360 * d, certificateRef: '', notes: 'Module 3 of 5 completed', createdAt: now - 5 * d },
    { id: 'tr-004', workspaceId: ws, employeeName: 'Carlos Lim', courseName: 'GDPR Awareness', category: 'compliance', status: 'expired', scheduledDate: now - 400 * d, completedDate: now - 395 * d, expirationDate: now - 30 * d, certificateRef: 'GDPR-2023-008', notes: 'Renewal needed', createdAt: now - 400 * d },
    { id: 'tr-005', workspaceId: ws, employeeName: 'Sofia Tan', courseName: 'Incident Response Procedures', category: 'security', status: 'scheduled', scheduledDate: now + 7 * d, expirationDate: now + 372 * d, certificateRef: '', notes: '', createdAt: now - 2 * d },
  ]);

  await db.incidents.bulkAdd([
    { id: 'inc-001', workspaceId: ws, title: 'Unauthorized Access Attempt', description: 'Multiple failed login attempts detected from unknown IP.', type: 'security', severity: 'high', status: 'resolved', reportedBy: 'IT Security', reportedDate: now - 15 * d, resolvedDate: now - 12 * d, linkedPolicies: ['pol-002'], linkedAssessments: [], linkedTasks: [], findings: 'Brute force attempt from external IP. No data compromised.', mitigationSteps: 'IP blocked. MFA enforcement expanded. Rate limiting implemented.', isRecurring: false, createdAt: now - 15 * d },
    { id: 'inc-002', workspaceId: ws, title: 'Customer Data Export Without Approval', description: 'Employee exported customer list without proper authorization.', type: 'compliance_violation', severity: 'medium', status: 'investigating', reportedBy: 'Compliance Team', reportedDate: now - 3 * d, linkedPolicies: ['pol-001'], linkedAssessments: ['asm-001'], linkedTasks: [], findings: '', mitigationSteps: '', isRecurring: false, createdAt: now - 3 * d },
    { id: 'inc-003', workspaceId: ws, title: 'Phishing Email Reported', description: 'Staff member reported suspicious email targeting credentials.', type: 'security', severity: 'low', status: 'closed', reportedBy: 'Mark Santos', reportedDate: now - 25 * d, resolvedDate: now - 24 * d, linkedPolicies: ['pol-002'], linkedAssessments: [], linkedTasks: [], findings: 'Phishing email blocked. No credentials compromised.', mitigationSteps: 'Security awareness reminder sent to all staff.', isRecurring: true, createdAt: now - 25 * d },
  ]);
}

export { db };
