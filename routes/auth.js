import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

const router = Router();

// REGISTER (users only)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing fields" });

    // Never allow creating admins via API
    const [exists] = await pool.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (exists.length)
      return res.status(409).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, "user")',
      [name, email, hash]
    );
    return res.json({ ok: true, message: "Registered, please login" });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// LOGIN (admin or user) with session regeneration
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const [rows] = await pool.query(
      "SELECT id, name, email, password_hash, role FROM users WHERE email = ?",
      [email]
    );
    if (!rows.length)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = rows[0];

    // Enforce single admin: only the seeded admin email can have role 'admin'
    const adminEmail = process.env.ADMIN_EMAIL;
    if (user.role === "admin" && user.email !== adminEmail) {
      return res.status(403).json({ error: "Admin access denied" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // Regenerate session to avoid fixation and clear old session data
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({ error: "Server error" });
      }

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
      return res.json({ ok: true, role: user.role });
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Logout failed" });
    }
    res.clearCookie("sid");
    res.json({ ok: true });
  });
});

// ME (session info)
router.get("/me", (req, res) => {
  if (!req.session.user) return res.json({ user: null });
  return res.json({ user: req.session.user });
});

export default router;
