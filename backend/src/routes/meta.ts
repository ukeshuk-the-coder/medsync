import { Router } from "express";
import db from "../db/index.js";

export const metaRouter = Router();

metaRouter.get("/states", (_req, res) => {
  const states = db.prepare(`SELECT id, name FROM states ORDER BY name`).all();
  res.json(states);
});

metaRouter.get("/cities", (req, res) => {
  const { stateId, stateName } = req.query as { stateId?: string; stateName?: string };
  let rows;
  if (stateId) {
    rows = db.prepare(`SELECT id, name FROM cities WHERE state_id = ? ORDER BY name`).all(stateId);
  } else if (stateName) {
    rows = db
      .prepare(`SELECT c.id, c.name FROM cities c JOIN states s ON s.id = c.state_id WHERE s.name = ? ORDER BY c.name`)
      .all(stateName);
  } else {
    rows = db.prepare(`SELECT id, name FROM cities ORDER BY name`).all();
  }
  res.json(rows);
});

metaRouter.get("/specialties", (_req, res) => {
  res.json(db.prepare(`SELECT id, name, icon FROM specialties ORDER BY name`).all());
});
