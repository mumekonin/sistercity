/**
 * One-time migration: convert string ObjectId references to real ObjectIds,
 * and backfill message.readBy for messages already marked READ.
 *
 * Usage (from backend/):
 *   DNS_SERVERS=10.17.73.150 node scripts/migrate-objectids.cjs
 *
 * Uses MONGO_URI from .env. Point at a test DB first before production.
 */
const fs = require('fs');
const path = require('path');
const dns = require('dns');
const mongoose = require('mongoose');

dns.setDefaultResultOrder('ipv4first');
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(',').map((s) => s.trim()));
}

function loadEnv() {
  const raw = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

function toOid(value) {
  if (value == null) return value;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === 'string' && mongoose.isValidObjectId(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return value;
}

function needsCast(value) {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

async function castField(coll, fieldPath) {
  const filter = { [fieldPath]: { $type: 'string' } };
  const docs = await coll.find(filter).toArray();
  let n = 0;
  for (const doc of docs) {
    const parts = fieldPath.split('.');
    let cur = doc;
    for (let i = 0; i < parts.length - 1; i++) {
      cur = cur?.[parts[i]];
      if (cur == null) break;
    }
    const leaf = parts[parts.length - 1];
    if (cur && needsCast(cur[leaf])) {
      await coll.updateOne(
        { _id: doc._id },
        { $set: { [fieldPath]: toOid(cur[leaf]) } },
      );
      n++;
    }
  }
  return n;
}

async function castArrayOfIds(coll, fieldPath) {
  const docs = await coll
    .find({ [fieldPath]: { $elemMatch: { $type: 'string' } } })
    .toArray();
  let n = 0;
  for (const doc of docs) {
    const arr = doc[fieldPath];
    if (!Array.isArray(arr)) continue;
    const next = arr.map(toOid);
    await coll.updateOne({ _id: doc._id }, { $set: { [fieldPath]: next } });
    n++;
  }
  return n;
}

async function castNestedArrayField(coll, arrayField, nestedField) {
  const docs = await coll.find({ [arrayField]: { $exists: true, $ne: [] } }).toArray();
  let n = 0;
  for (const doc of docs) {
    const arr = doc[arrayField];
    if (!Array.isArray(arr)) continue;
    let changed = false;
    const next = arr.map((item) => {
      if (!item || typeof item !== 'object') return item;
      if (!needsCast(item[nestedField])) return item;
      changed = true;
      return { ...item, [nestedField]: toOid(item[nestedField]) };
    });
    if (changed) {
      await coll.updateOne({ _id: doc._id }, { $set: { [arrayField]: next } });
      n++;
    }
  }
  return n;
}

(async () => {
  const env = loadEnv();
  const uri = process.env.MONGO_URI || env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI missing');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  console.log(`Connected to ${db.databaseName}`);

  const report = {};

  // Top-level refs
  report['budgets.project'] = await castField(db.collection('budgets'), 'project');
  report['equipment.project'] = await castField(db.collection('equipment'), 'project');
  report['equipment.recordedBy'] = await castField(
    db.collection('equipment'),
    'recordedBy',
  );
  report['notifications.recipient'] = await castField(
    db.collection('notifications'),
    'recipient',
  );
  report['reports.generatedBy'] = await castField(
    db.collection('reports'),
    'generatedBy',
  );
  report['news.author'] = await castField(db.collection('news'), 'author');
  report['news.relatedProject'] = await castField(
    db.collection('news'),
    'relatedProject',
  );
  report['events.relatedProject'] = await castField(
    db.collection('events'),
    'relatedProject',
  );
  report['events.createdBy'] = await castField(
    db.collection('events'),
    'createdBy',
  );
  report['documentfiles.uploadedBy'] = await castField(
    db.collection('documentfiles'),
    'uploadedBy',
  );
  report['documentfiles.relatedProject'] = await castField(
    db.collection('documentfiles'),
    'relatedProject',
  );
  report['documentfiles.approvedBy'] = await castField(
    db.collection('documentfiles'),
    'approvedBy',
  );

  // Messages
  report['messages.from.userId'] = await castField(
    db.collection('messages'),
    'from.userId',
  );
  report['messages.to.userId'] = await castField(
    db.collection('messages'),
    'to.userId',
  );
  report['messages.threadId'] = await castField(
    db.collection('messages'),
    'threadId',
  );
  report['messages.parentId'] = await castField(
    db.collection('messages'),
    'parentId',
  );
  report['messages.relatedProject'] = await castField(
    db.collection('messages'),
    'relatedProject',
  );
  report['messages.readBy'] = await castArrayOfIds(
    db.collection('messages'),
    'readBy',
  );

  // Projects nested
  report['projects.proposedByUser'] = await castField(
    db.collection('projects'),
    'proposedByUser',
  );
  report['projects.adama.focalPerson'] = await castField(
    db.collection('projects'),
    'adama.focalPerson',
  );
  report['projects.aurora.focalPerson'] = await castField(
    db.collection('projects'),
    'aurora.focalPerson',
  );
  report['projects.tasks.assignedTo'] = await castNestedArrayField(
    db.collection('projects'),
    'tasks',
    'assignedTo',
  );
  report['projects.issues.raisedBy'] = await castNestedArrayField(
    db.collection('projects'),
    'issues',
    'raisedBy',
  );

  // Budgets nested expenditures
  report['budgets.expenditures.recordedBy'] = await castNestedArrayField(
    db.collection('budgets'),
    'expenditures',
    'recordedBy',
  );
  report['budgets.expenditures.approvedBy'] = await castNestedArrayField(
    db.collection('budgets'),
    'expenditures',
    'approvedBy',
  );

  // Backfill readBy for messages already READ (legacy shared flag)
  const msgs = db.collection('messages');
  const legacy = await msgs
    .find({
      status: { $in: ['READ', 'REPLIED', 'CLOSED'] },
      $or: [{ readBy: { $exists: false } }, { readBy: { $size: 0 } }],
      'to.userId': { $ne: null },
    })
    .toArray();
  let backfill = 0;
  for (const m of legacy) {
    if (!m.to?.userId) continue;
    await msgs.updateOne(
      { _id: m._id },
      { $addToSet: { readBy: toOid(m.to.userId) } },
    );
    backfill++;
  }
  report['messages.readByBackfillDirect'] = backfill;

  console.log('Migration summary (docs updated per field):');
  for (const [k, v] of Object.entries(report)) {
    if (v) console.log(`  ${k}: ${v}`);
  }
  console.log('Done.');
  await mongoose.disconnect();
})().catch((e) => {
  console.error('MIGRATE_FAIL', e);
  process.exit(1);
});
