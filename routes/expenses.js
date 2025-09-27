import express from 'express';
import { pool } from '../db.js'; // your MySQL pool connection
import { requireAdmin } from '../middleware/auth.js';


const router = express.Router();

// Save a single expense
router.post('/',requireAdmin, async (req, res) => {
  try {
    const { date, category, description, amount } = req.body;
    if (!date || !amount) {
      return res.status(400).json({ error: 'Date and amount required' });
    }

    await pool.query(
      'INSERT INTO expenses (date, category, description, amount) VALUES (?, ?, ?, ?)',
      [date, category || null, description || null, amount]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving expense:', error);
    res.status(500).json({ error: 'Failed to save expense' });
  }
});

// Get expenses between start and end dates
router.get('/',requireAdmin, async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) {
    return res.status(400).json({ error: 'Start and end dates required' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date ASC',
      [start, end]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get total earnings from orders between start and end dates
router.get('/orders/total', async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) {
    return res.status(400).json({ error: 'Start and end dates required' });
  }

  try {
    const [[{ total }]] = await pool.query(
      'SELECT IFNULL(SUM(payable - balance), 0) as total FROM orders WHERE order_date BETWEEN ? AND ?',
      [start, end]
    );
    res.json({ total });
  } catch (error) {
    console.error('Error fetching total earnings:', error);
    res.status(500).json({ error: 'Failed to fetch total earnings' });
  }
});

// Delete an expense by id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Expense ID is required' });
  }

  try {
    const [result] = await pool.query('DELETE FROM expenses WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});


export default router;
