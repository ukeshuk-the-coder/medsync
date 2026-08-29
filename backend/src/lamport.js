const db = require('./db');

// Lamport logical clock helper.
// Each hospital "node" keeps its own monotonically increasing counter.
// On a local event, the node increments its own clock.
// On receiving a message from another node, clock = max(local, received) + 1.

function tickNode(nodeId) {
  const node = db.prepare('SELECT * FROM hospital_nodes WHERE id = ?').get(nodeId);
  const newClock = node.lamport_clock + 1;
  db.prepare('UPDATE hospital_nodes SET lamport_clock = ?, last_sync = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newClock, nodeId);
  return newClock;
}

function syncClocks(nodeIds) {
  // When the coordination service compares events across nodes, every
  // participating node's clock is advanced to max+1 to reflect the sync.
  const nodes = nodeIds.map(id => db.prepare('SELECT * FROM hospital_nodes WHERE id = ?').get(id));
  const maxClock = Math.max(...nodes.map(n => n.lamport_clock));
  const synced = maxClock + 1;
  nodeIds.forEach(id => {
    db.prepare('UPDATE hospital_nodes SET lamport_clock = ?, last_sync = CURRENT_TIMESTAMP WHERE id = ?')
      .run(synced, id);
  });
  return synced;
}

function logEvent({ nodeId, eventType, doctorId, patientLabel, lamportClock, details }) {
  db.prepare(`INSERT INTO booking_events (node_id, event_type, doctor_id, patient_label, lamport_clock, details)
              VALUES (?, ?, ?, ?, ?, ?)`)
    .run(nodeId, eventType, doctorId || null, patientLabel || null, lamportClock, details || null);
}

module.exports = { tickNode, syncClocks, logEvent };
