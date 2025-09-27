import { Router } from "express";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// 💾 Save Order — with optional customer insert
router.post("/", async (req, res) => {
  const {
    customerPhone,
    customerName,
    orderDate,
    paymentMode,
    totalAmount,
    advancePayment,
    balance,
    cart,
    gstIncluded,
    paidInFull,
    gstAmount,
    payable,
    subtotal,
  } = req.body;

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    let customerId = null;

    if (customerPhone && customerPhone.trim() !== "") {
      const cleanPhone = customerPhone.trim();

      // 🔍 Check if customer exists
      const [customerRows] = await conn.query(
        "SELECT * FROM customers WHERE mobile = ?",
        [cleanPhone]
      );

      if (customerRows.length > 0) {
        customerId = customerRows[0].id;
      } else if (customerName && customerName.trim() !== "") {
        // 🆕 Insert new customer only if name is provided
        const [result] = await conn.query(
          "INSERT INTO customers (name, mobile) VALUES (?, ?)",
          [customerName.trim(), cleanPhone]
        );
        customerId = result.insertId;
      }
    }

    const [orderResult] = await conn.query(
      `INSERT INTO orders 
    (customer_id, order_date, total_amount, advance_payment, balance, payment_mode, gst_included, paid_in_full, gst_amount, payable, subtotal)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customerId,
        orderDate,
        totalAmount,
        advancePayment,
        balance,
        paymentMode,
        gstIncluded ? 1 : 0,
        paidInFull ? 1 : 0,
        gstAmount,
        payable,
        subtotal,
      ]
    );

    const orderId = orderResult.insertId;

    // 💾 Insert order items
    for (const item of cart) {
      await conn.query(
        "INSERT INTO order_items (order_id, product_id, quantity, rate) VALUES (?, ?, ?, ?)",
        [orderId, item.id, item.quantity, item.price]
      );
    }

    await conn.commit();
    res.json({ success: true, orderId });
  } catch (err) {
    await conn.rollback();
    console.error("[❌ Order Save Failed]", err);
    res.status(500).json({ error: "Failed to save order" });
  } finally {
    conn.release();
  }
});

// Order History
router.get("/", requireAdmin, async (req, res) => {
  try {
    const { mobile, start, end } = req.query;
    const params = [];

    let sql = `
      SELECT
        o.id AS orderId,
        o.order_date AS orderDate,
        COALESCE(c.mobile, 'N/A') AS customerMobile,
        GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR ', ') AS products,
        o.total_amount AS totalAmount,
        o.payable AS payable
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE 1=1
    `;

    if (mobile) {
      sql += " AND c.mobile = ?";
      params.push(mobile);
    }

    if (start && end) {
      sql +=
        " AND o.order_date >= ? AND o.order_date < DATE_ADD(?, INTERVAL 1 DAY)";
      params.push(start, end);
    }

    sql += `
      GROUP BY o.id
      ORDER BY o.order_date DESC
    `;

    const [rows] = await pool.query(sql, params);

    res.json(rows);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// router.get("/customers-with-balance", async (req, res) => {
//   try {
//     const sql = `
//  SELECT
//   c.id AS customerId,
//   c.name AS customerName,
//   c.mobile AS customerMobile,
//   latest_order.orderId,
//   latest_order.orderDate,
//   latest_order.last_message_sent,
//   totals.balance,
//   totals.totalAmount,
//   order_dates.orderStart,
//   order_dates.orderEnd
// FROM customers c
// LEFT JOIN (
//   SELECT
//     o.customer_id,
//     SUM(o.balance) AS balance,
//     SUM(o.total_amount) AS totalAmount
//   FROM orders o
//   WHERE o.balance > 0 AND (o.paid IS NULL OR o.paid = 0)
//   GROUP BY o.customer_id
// ) AS totals ON c.id = totals.customer_id
// LEFT JOIN (
//   SELECT *
//   FROM (
//     SELECT
//       o1.id AS orderId,
//       o1.customer_id,
//       o1.order_date AS orderDate,
//       o1.last_message_sent,
//       ROW_NUMBER() OVER (
//         PARTITION BY o1.customer_id
//         ORDER BY o1.order_date DESC, o1.id DESC
//       ) AS rn
//     FROM orders o1
//     WHERE o1.balance > 0 AND (o1.paid IS NULL OR o1.paid = 0)
//   ) ranked
//   WHERE rn = 1
// ) AS latest_order ON c.id = latest_order.customer_id
// LEFT JOIN (
//   SELECT
//     o.customer_id,
//     MIN(o.order_date) AS orderStart,
//     MAX(o.order_date) AS orderEnd
//   FROM orders o
//   WHERE o.balance > 0 AND (o.paid IS NULL OR o.paid = 0)
//   GROUP BY o.customer_id
// ) AS order_dates ON c.id = order_dates.customer_id
// WHERE totals.balance IS NOT NULL;
// `;

//     const [rows] = await pool.query(sql);
//     // res.json(rows);
//     res.json({ success: true, customers: rows });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Database error" });
//   }
// });

router.get("/customers-with-balance", async (req, res) => {
  try {
    const sql = `
      SELECT
        c.id AS customerId,
        c.name AS customerName,
        c.mobile AS customerMobile,
        latest_order.orderId,
        latest_order.orderDate,
        latest_order.last_message_sent,
        totals.balance,
        totals.totalAmount,
        order_dates.orderStart,
        order_dates.orderEnd
      FROM customers c
      LEFT JOIN (
        SELECT
          o.customer_id,
          SUM(o.balance) AS balance,
          SUM(o.total_amount) AS totalAmount
        FROM orders o
        WHERE o.balance > 0 AND (o.paid IS NULL OR o.paid = 0)
        GROUP BY o.customer_id
      ) AS totals ON c.id = totals.customer_id
      LEFT JOIN (
        SELECT o1.id AS orderId, o1.customer_id, o1.order_date AS orderDate, o1.last_message_sent
        FROM orders o1
        INNER JOIN (
          SELECT customer_id, MAX(order_date) AS max_order_date
          FROM orders
          WHERE balance > 0 AND (paid IS NULL OR paid = 0)
          GROUP BY customer_id
        ) AS max_dates
          ON o1.customer_id = max_dates.customer_id
          AND o1.order_date = max_dates.max_order_date
        INNER JOIN (
          SELECT customer_id, order_date, MAX(id) AS max_id
          FROM orders
          WHERE balance > 0 AND (paid IS NULL OR paid = 0)
          GROUP BY customer_id, order_date
        ) AS max_ids
          ON o1.customer_id = max_ids.customer_id
          AND o1.order_date = max_ids.order_date
          AND o1.id = max_ids.max_id
      ) AS latest_order ON c.id = latest_order.customer_id
      LEFT JOIN (
        SELECT
          o.customer_id,
          MIN(o.order_date) AS orderStart,
          MAX(o.order_date) AS orderEnd
        FROM orders o
        WHERE o.balance > 0 AND (o.paid IS NULL OR o.paid = 0)
        GROUP BY o.customer_id
      ) AS order_dates ON c.id = order_dates.customer_id
      WHERE totals.balance IS NOT NULL;
    `;

    const [rows] = await pool.query(sql);
    res.json({ success: true, customers: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/with-balance/:customerId", async (req, res) => {
  const { customerId } = req.params;

  if (!customerId) {
    return res.status(400).json({ error: "Missing customerId" });
  }

  try {
    const sql = `
      SELECT
        o.id AS orderId,
        o.order_date,
        o.payable,
        o.balance,
        o.paid,
        o.paid_in_full,
        o.gst_amount,
        oi.id AS orderItemId,
        oi.quantity,
        oi.rate,
        p.name AS product_name
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.customer_id = ? AND o.balance > 0 AND (o.paid IS NULL OR o.paid = 0)
      ORDER BY o.order_date ASC, o.id ASC, oi.id ASC
    `;

    const [rows] = await pool.query(sql, [customerId]);

    // Group orders and attach items
    const ordersMap = new Map();

    rows.forEach((row) => {
      if (!ordersMap.has(row.orderId)) {
        ordersMap.set(row.orderId, {
          orderId: row.orderId,
          order_date: row.order_date,
          payable: row.payable,
          balance: row.balance,
          gst_amount: row.gst_amount,
          items: [],
        });
      }

      if (row.orderItemId) {
        ordersMap.get(row.orderId).items.push({
          id: row.orderItemId,
          product_name: row.product_name,
          quantity: row.quantity,
          rate: row.rate,
        });
      }
    });

    const orders = Array.from(ordersMap.values());

    res.json({ success: true, orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/pay", async (req, res) => {
  const { customerId, amount } = req.body;
  if (!customerId || !amount || amount <= 0) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid parameters" });
  }

  try {
    // Fetch all unpaid orders for the customer ordered by oldest first
    const [orders] = await pool.query(
      `SELECT id, balance FROM orders WHERE customer_id = ? AND (paid IS NULL OR paid = 0) AND balance > 0 ORDER BY order_date ASC`,
      [customerId]
    );

    let remainingAmount = amount;

    for (const order of orders) {
      if (remainingAmount <= 0) break;

      if (order.balance <= remainingAmount) {
        // Fully pay this order
        remainingAmount -= order.balance;
        await pool.query(
          `UPDATE orders SET balance = 0, paid = 1 WHERE id = ?`,
          [order.id]
        );
      } else {
        // Partial pay this order
        const newBalance = order.balance - remainingAmount;
        await pool.query(`UPDATE orders SET balance = ? WHERE id = ?`, [
          newBalance,
          order.id,
        ]);
        remainingAmount = 0;
      }
    }

    // Calculate new total balance for customer
    const [[{ newBalance }]] = await pool.query(
      `SELECT IFNULL(SUM(balance), 0) AS newBalance FROM orders WHERE customer_id = ? AND (paid IS NULL OR paid = 0)`,
      [customerId]
    );

    res.json({ success: true, newBalance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// inVOICE
// GET /api/orders/:orderId
router.get("/:orderId", async (req, res) => {
  const orderId = req.params.orderId;

  try {
    // Fetch order info
    const [orders] = await pool.query(
      `SELECT 
      o.id AS orderId, 
      o.order_date AS orderDate, 
      o.subtotal, 
      o.gst_amount AS gstAmount,
      o.gst_included AS gstIncluded, 
      o.total_amount AS totalAmount,
      o.payable, 
      o.advance_payment AS advancePayment,
      o.balance,
      o.paid_in_full AS paidInFull,
      c.name AS customerName, 
      c.mobile AS customerMobile
   FROM orders o
   LEFT JOIN customers c ON o.customer_id = c.id
   WHERE o.id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Fetch order items
    const [items] = await pool.query(
      `SELECT p.name AS description, oi.quantity, oi.rate
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    const order = orders[0];
    order.items = items;

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
