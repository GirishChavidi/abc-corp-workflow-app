import { dbReady } from './database.js';
import bcrypt from 'bcryptjs';

async function seed() {
const db = await dbReady;
console.log('Seeding ABC Corp database...\n');

// ─── Clear existing data ────────────────────────────────────────────────────
db.exec(`
  DELETE FROM certifications;
  DELETE FROM project_trainees;
  DELETE FROM trainings;
  DELETE FROM projects;
  DELETE FROM users;
  DELETE FROM vendors;
  DELETE FROM clients;
  DELETE FROM workflow_templates;
`);

// ─── Clients ────────────────────────────────────────────────────────────────
const clientIds = [];
const clientsData = [
  { name: 'TechVista Solutions', industry: 'Technology' },
  { name: 'Global Finance Corp', industry: 'Finance' },
  { name: 'HealthFirst Labs', industry: 'Healthcare' },
  { name: 'RetailMax Inc', industry: 'Retail' },
  { name: 'EduPrime Academy', industry: 'Education' }
];

for (const c of clientsData) {
  const r = db.prepare('INSERT INTO clients (name, industry) VALUES (?, ?)').run(c.name, c.industry);
  clientIds.push(r.lastInsertRowid);
}
console.log(`Created ${clientIds.length} clients`);

// ─── Vendors ────────────────────────────────────────────────────────────────
const vendorIds = [];
const vendorsData = [
  { name: 'SkillForge Training', specs: ['computer_skills', 'logic_skills'], email: 'info@skillforge.com' },
  { name: 'BizAcademy Pro', specs: ['business_skills'], email: 'contact@bizacademy.com' },
  { name: 'CodeMasters Institute', specs: ['computer_skills'], email: 'admin@codemasters.com' },
  { name: 'LogicLab Solutions', specs: ['logic_skills', 'business_skills'], email: 'hello@logiclab.com' },
  { name: 'AllSkills Training Center', specs: ['computer_skills', 'business_skills', 'logic_skills'], email: 'support@allskills.com' }
];

for (const v of vendorsData) {
  const r = db.prepare('INSERT INTO vendors (name, specializations, contact_email) VALUES (?, ?, ?)').run(v.name, JSON.stringify(v.specs), v.email);
  vendorIds.push(r.lastInsertRowid);
}
console.log(`Created ${vendorIds.length} vendors`);

// ─── Users ──────────────────────────────────────────────────────────────────
const passwordHash = bcrypt.hashSync('password123', 10);

const usersData = [
  { email: 'admin@abccorp.com', name: 'Sarah Johnson', role: 'account_manager', client_id: null, designation: 'Senior Account Manager' },
  { email: 'manager@abccorp.com', name: 'Michael Chen', role: 'account_manager', client_id: null, designation: 'Account Manager' },
  { email: 'john@techvista.com', name: 'John Smith', role: 'client', client_id: clientIds[0], designation: 'IT Director' },
  { email: 'lisa@globalfinance.com', name: 'Lisa Wang', role: 'client', client_id: clientIds[1], designation: 'Project Manager' },
  { email: 'robert@healthfirst.com', name: 'Robert Brown', role: 'client', client_id: clientIds[2], designation: 'Operations Head' }
];

const userIds = [];
for (const u of usersData) {
  const r = db.prepare(
    'INSERT INTO users (email, password_hash, name, role, client_id, designation) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(u.email, passwordHash, u.name, u.role, u.client_id, u.designation);
  userIds.push(r.lastInsertRowid);
}
console.log(`Created ${userIds.length} users`);

// ─── Trainees ───────────────────────────────────────────────────────────────
const traineeNames = [
  'Alice Turner', 'Bob Martinez', 'Carol Davis', 'David Wilson', 'Emma Clark',
  'Frank Lee', 'Grace Kim', 'Henry Taylor', 'Ivy Anderson', 'Jack Thomas'
];
const traineeIds = [];
for (let i = 0; i < traineeNames.length; i++) {
  const r = db.prepare('INSERT INTO trainees (name, email, phone) VALUES (?, ?, ?)')
    .run(traineeNames[i], `${traineeNames[i].toLowerCase().replace(' ', '.')}@email.com`, `555-010${i}`);
  traineeIds.push(r.lastInsertRowid);
}
console.log(`Created ${traineeIds.length} trainees`);

// ─── Projects with Workflow Data ────────────────────────────────────────────
const sampleWorkflow = {
  nodes: [
    { id: 'start', type: 'startNode', position: { x: 250, y: 0 }, data: { label: 'Project Start' } },
    { id: 'type-check', type: 'decisionNode', position: { x: 250, y: 100 }, data: { label: 'On-site or Off-site?', field: 'project_type', options: ['on-site', 'off-site'] } },
    { id: 'training-check', type: 'decisionNode', position: { x: 250, y: 220 }, data: { label: 'Training Required?', field: 'training_required', options: ['yes', 'no'] } },
    { id: 'training-select', type: 'trainingNode', position: { x: 100, y: 340 }, data: { label: 'Select Trainings', trainings: ['computer_skills', 'business_skills'] } },
    { id: 'payment', type: 'paymentNode', position: { x: 100, y: 460 }, data: { label: 'Payment Assignment', payments: {} } },
    { id: 'vendor-assign', type: 'vendorNode', position: { x: 100, y: 580 }, data: { label: 'Assign Vendors' } },
    { id: 'cert-check', type: 'decisionNode', position: { x: 100, y: 700 }, data: { label: 'Certification Required?', field: 'certification', options: ['yes', 'no'] } },
    { id: 'interview', type: 'processNode', position: { x: 250, y: 820 }, data: { label: 'Client Interviews' } },
    { id: 'shortlist', type: 'processNode', position: { x: 250, y: 940 }, data: { label: 'Shortlist Candidates' } },
    { id: 'offer', type: 'processNode', position: { x: 250, y: 1060 }, data: { label: 'Offer Letters' } },
    { id: 'hire', type: 'endNode', position: { x: 250, y: 1180 }, data: { label: 'Hire' } }
  ],
  edges: [
    { id: 'e-start-type', source: 'start', target: 'type-check' },
    { id: 'e-type-training', source: 'type-check', target: 'training-check' },
    { id: 'e-training-select', source: 'training-check', target: 'training-select', label: 'Yes' },
    { id: 'e-training-interview', source: 'training-check', target: 'interview', label: 'No' },
    { id: 'e-select-payment', source: 'training-select', target: 'payment' },
    { id: 'e-payment-vendor', source: 'payment', target: 'vendor-assign' },
    { id: 'e-vendor-cert', source: 'vendor-assign', target: 'cert-check' },
    { id: 'e-cert-interview', source: 'cert-check', target: 'interview' },
    { id: 'e-interview-shortlist', source: 'interview', target: 'shortlist' },
    { id: 'e-shortlist-offer', source: 'shortlist', target: 'offer' },
    { id: 'e-offer-hire', source: 'offer', target: 'hire' }
  ]
};

const projectsData = [
  { client_id: clientIds[0], manager_id: userIds[0], name: 'Enterprise Cloud Migration', desc: 'Cloud infrastructure training program', type: 'on-site', status: 'active' },
  { client_id: clientIds[1], manager_id: userIds[0], name: 'Financial Analytics Team', desc: 'Data analytics team building', type: 'off-site', status: 'training' },
  { client_id: clientIds[2], manager_id: userIds[1], name: 'Digital Health Platform', desc: 'Healthcare IT staff augmentation', type: 'on-site', status: 'draft' },
  { client_id: clientIds[0], manager_id: userIds[1], name: 'DevOps Transformation', desc: 'DevOps practice implementation', type: 'off-site', status: 'active' }
];

const projectIds = [];
for (const p of projectsData) {
  const r = db.prepare(
    'INSERT INTO projects (client_id, account_manager_id, name, description, type, status, workflow_data) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(p.client_id, p.manager_id, p.name, p.desc, p.type, p.status, JSON.stringify(sampleWorkflow));
  projectIds.push(r.lastInsertRowid);
}
console.log(`Created ${projectIds.length} projects`);

// ─── Trainings ──────────────────────────────────────────────────────────────
const trainingsData = [
  // Project 1 (on-site): 2 trainings required
  { project_id: projectIds[0], type: 'computer_skills', vendor_id: vendorIds[0], paid_by: 'abc_corp', cert: 1, status: 'in_progress' },
  { project_id: projectIds[0], type: 'business_skills', vendor_id: vendorIds[1], paid_by: 'client', cert: 1, status: 'pending' },
  // Project 2 (off-site): 1 training
  { project_id: projectIds[1], type: 'logic_skills', vendor_id: vendorIds[3], paid_by: 'trainee', cert: 0, status: 'completed' },
  // Project 3 (on-site): 2 trainings
  { project_id: projectIds[2], type: 'computer_skills', vendor_id: vendorIds[2], paid_by: 'abc_corp', cert: 1, status: 'pending' },
  { project_id: projectIds[2], type: 'logic_skills', vendor_id: vendorIds[3], paid_by: 'client', cert: 0, status: 'pending' },
  // Project 4 (off-site): 1 training
  { project_id: projectIds[3], type: 'business_skills', vendor_id: vendorIds[4], paid_by: 'abc_corp', cert: 1, status: 'in_progress' }
];

for (const t of trainingsData) {
  db.prepare(
    'INSERT INTO trainings (project_id, type, vendor_id, paid_by, certification_required, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(t.project_id, t.type, t.vendor_id, t.paid_by, t.cert, t.status);
}
console.log(`Created ${trainingsData.length} trainings`);

// ─── Assign trainees to projects ────────────────────────────────────────────
const statuses = ['sourced', 'training', 'certified', 'interviewed', 'shortlisted', 'offer_given', 'hired'];
let assignmentCount = 0;
for (let pi = 0; pi < projectIds.length; pi++) {
  for (let ti = pi * 2; ti < (pi * 2) + 3 && ti < traineeIds.length; ti++) {
    const status = statuses[ti % statuses.length];
    db.prepare('INSERT INTO project_trainees (project_id, trainee_id, status) VALUES (?, ?, ?)').run(projectIds[pi], traineeIds[ti], status);
    assignmentCount++;
  }
}
console.log(`Created ${assignmentCount} trainee assignments`);

// ─── Workflow Template ──────────────────────────────────────────────────────
db.prepare(
  'INSERT INTO workflow_templates (name, description, workflow_data, created_by) VALUES (?, ?, ?, ?)'
).run('Standard On-site Flow', 'Default workflow for on-site projects with training', JSON.stringify(sampleWorkflow), userIds[0]);

db.prepare(
  'INSERT INTO workflow_templates (name, description, workflow_data, created_by) VALUES (?, ?, ?, ?)'
).run('Quick Off-site Flow', 'Simplified workflow for off-site projects', JSON.stringify({
  nodes: [
    { id: 'start', type: 'startNode', position: { x: 250, y: 0 }, data: { label: 'Project Start' } },
    { id: 'training-check', type: 'decisionNode', position: { x: 250, y: 120 }, data: { label: 'Training Required?', field: 'training_required', options: ['yes', 'no'] } },
    { id: 'interview', type: 'processNode', position: { x: 250, y: 260 }, data: { label: 'Client Interviews' } },
    { id: 'hire', type: 'endNode', position: { x: 250, y: 380 }, data: { label: 'Hire' } }
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'training-check' },
    { id: 'e2', source: 'training-check', target: 'interview' },
    { id: 'e3', source: 'interview', target: 'hire' }
  ]
}), userIds[0]);

console.log('Created 2 workflow templates');
console.log('\n✅ Seed complete!');
console.log('\n📧 Login credentials (all passwords: password123):');
console.log('  Account Manager: admin@abccorp.com');
console.log('  Account Manager: manager@abccorp.com');
console.log('  Client (TechVista): john@techvista.com');
console.log('  Client (Global Finance): lisa@globalfinance.com');
console.log('  Client (HealthFirst): robert@healthfirst.com');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
