import { Router } from "express";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// ✅ Create new customer
router.post("/add", async (req, res) => {
  try {
    const { name, mobile, date_added, address, service, remarks } = req.body;

    await pool.query(
      "INSERT INTO customers (name, mobile, date_added, address, service, remarks) VALUES (?, ?, ?, ?, ?, ?)",
      [name, mobile, date_added, address, service, remarks]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get All customer (Billing)
router.get("/", async (req, res) => {
  try {
    const { mobile } = req.query;
    const [rows] = await pool.query(
      "SELECT * FROM customers WHERE mobile = ?",
      [mobile]
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// API: GET /api/customers/search?name=John OR ?mobile=9876
router.get("/search", async (req, res) => {
  const { name, mobile } = req.query;

  try {
    let query = "";
    let values = [];

    if (mobile) {
      query = "SELECT * FROM customers WHERE mobile LIKE ? LIMIT 10";
      values = [`%${mobile}%`];
    } else if (name) {
      query = "SELECT * FROM customers WHERE name LIKE ? LIMIT 10";
      values = [`%${name}%`];
    } else {
      return res.status(400).json({ error: "Missing name or mobile query" });
    }

    const [rows] = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error("Error in /api/customers/search:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ Get all customers
router.get("/view", requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM customers ORDER BY date_added DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ Update customer by ID
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile, date_added, address, service, remarks } = req.body;

    await pool.query(
      `UPDATE customers 
       SET name = ?, mobile = ?, date_added = ?, address = ?, service = ?, remarks = ?
       WHERE id = ?`,
      [name, mobile, date_added, address, service, remarks, id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ Delete customer by ID
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM customers WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
