const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');

function fail(message) {
  throw new Error(message);
}

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(target) : [target];
  });
}

const serverRoot = path.join(root, 'backend', 'server');
const unsafeConsole = filesUnder(serverRoot)
  .filter((file) => file.endsWith('.ts'))
  .filter((file) => !file.includes(`${path.sep}__tests__${path.sep}`))
  .filter((file) => !file.includes(`${path.sep}scripts${path.sep}`))
  .filter((file) => !file.endsWith(path.join('observability', 'logger.ts')))
  .flatMap((file) => {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    return lines.flatMap((line, index) =>
      /\bconsole\.(?:log|warn|error|info|debug)\s*\(/.test(line)
        ? [`${path.relative(root, file)}:${index + 1}`]
        : []
    );
  });
if (unsafeConsole.length > 0) fail(`Unsafe production console calls: ${unsafeConsole.join(', ')}`);

const alertPath = path.join(root, 'scripts', 'operations', 'alerts.json');
const alertContract = JSON.parse(fs.readFileSync(alertPath, 'utf8'));
if (alertContract.schema_version !== 1 || !Array.isArray(alertContract.alerts)) {
  fail('Alert contract must use schema_version 1 and an alerts array');
}
const alertIds = new Set();
for (const alert of alertContract.alerts) {
  if (!/^[a-z][a-z0-9-]{2,79}$/.test(alert.id) || alertIds.has(alert.id)) {
    fail(`Invalid or duplicate alert id: ${alert.id}`);
  }
  alertIds.add(alert.id);
  if (!['page', 'ticket'].includes(alert.severity)) fail(`Invalid alert severity: ${alert.id}`);
  if (!/^verigate_[a-z0-9_]+$/.test(alert.metric)) fail(`Invalid alert metric: ${alert.id}`);
  if (typeof alert.condition !== 'string' || !alert.condition.trim()) fail(`Missing condition: ${alert.id}`);
  if (!/^\d+[mh]$/.test(alert.for)) fail(`Invalid alert duration: ${alert.id}`);
  const [relativeDoc, anchor] = String(alert.runbook).split('#');
  const documentPath = path.join(root, relativeDoc);
  if (!anchor || !fs.existsSync(documentPath)) fail(`Missing runbook document: ${alert.id}`);
  const anchors = fs.readFileSync(documentPath, 'utf8').split(/\r?\n/)
    .filter((line) => /^#{1,6}\s+/.test(line))
    .map((line) => line.replace(/^#{1,6}\s+/, '').trim().toLowerCase()
      .replace(/[^a-z0-9 _-]/g, '')
      .replace(/\s+/g, '-'));
  if (!anchors.includes(anchor)) fail(`Missing runbook anchor: ${alert.runbook}`);
}

const inventory = fs.readFileSync(path.join(root, 'docs', 'admin-audit-inventory.md'), 'utf8');
for (const route of [
  'POST /api/events',
  'POST /api/access/assignments',
  'PUT /api/users/:id/status',
  'POST /api/notifications/send',
  'POST /api/privacy/retention/runs/batch',
  'PUT /api/admin/qr-compatibility',
  'POST /api/incidents/:id/actions/:action',
  'POST /api/devices/events/:event_id/registrations/:id/deregister',
]) {
  if (!inventory.includes(route)) fail(`Administrative audit inventory is missing ${route}`);
}

const incidentGuide = fs.readFileSync(path.join(root, 'docs', 'incident-response.md'), 'utf8');
for (const section of ['## Severity and authority', '## First 15 minutes', '## Evidence preservation', '## Recovery and validation', '## Tabletop exercise']) {
  if (!incidentGuide.includes(section)) fail(`Incident response guide is missing ${section}`);
}

console.log(`Verified operations contracts (${alertIds.size} alerts)`);
