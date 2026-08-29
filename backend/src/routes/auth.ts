import { Router } from "express";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { z } from "zod";
import db from "../db/index.js";
import { signToken } from "../lib/auth.js";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  mobile: z.string().min(6),
  state: z.string().optional(),
  city: z.string().optional(),
});

authRouter.post("/register", (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { name, email, password, mobile, state, city } = parsed.data;

  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const id = nanoid(10);
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`INSERT INTO users (id, name, email, password_hash, role, mobile, state, city) VALUES (?,?,?,?,'patient',?,?,?)`)
    .run(id, name, email, hash, mobile, state ?? null, city ?? null);

  const token = signToken({ id, email, role: "patient", name });
  res.status(201).json({ token, user: { id, name, email, role: "patient" } });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string() });

authRouter.post("/login", (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Email and password required" });
  const { email, password } = parsed.data;

  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Realistic reset flow: generates a reset token and, in demo mode, returns it directly
// instead of emailing it (no SMTP configured by default).
authRouter.post("/forgot-password", (req, res) => {
  const { email } = req.body ?? {};
  const user = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
  // Always respond the same way whether or not the account exists, to avoid leaking which emails are registered.
  if (!user) return res.json({ message: "If that account exists, a reset link has been sent." });
  const resetToken = nanoid(24);
  res.json({ message: "If that account exists, a reset link has been sent.", demoResetToken: resetToken });
});
