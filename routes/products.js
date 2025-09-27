import { Router } from 'express';
import { pool } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';


const router = Router();

// Add product (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, price} = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price required' });

    await pool.query(
      'INSERT INTO products (name, price) VALUES (?, ?)',
      [name, price]
    );

    res.json({ ok: true, message: 'Product added successfully' });
  } catch (err) {
    console.error('Add product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔍 Search products by name
router.get('/', async (req, res) => {
    try {
        const { q } = req.query;
        const [rows] = await pool.query(
            'SELECT * FROM products WHERE name LIKE ? LIMIT 5',
            [`%${q}%`]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});


// serch 
// GET /api/products? q=<search term>
router.get('/all', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});



//edit
// PATCH /api/products/:id
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;

    if (name === undefined && price === undefined) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }
    if (price !== undefined) {
      fields.push('price = ?');
      values.push(price);
    }

    values.push(id);

    const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await pool.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ ok: true, message: 'Product updated successfully' });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});




// DELETE /api/products/bulk-delete
// In your products router (e.g. routes/products.js)
router.delete('/bulk-delete', requireAdmin, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No product IDs provided' });
    }

    const placeholders = ids.map(() => '?').join(',');

    await pool.query('START TRANSACTION');
    try {
      // First delete related order_items
      await pool.query(`DELETE FROM order_items WHERE product_id IN (${placeholders})`, ids);
      
      // Then delete products
      const [result] = await pool.query(`DELETE FROM products WHERE id IN (${placeholders})`, ids);

      await pool.query('COMMIT');

      res.json({ deletedCount: result.affectedRows });
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


export default router;
