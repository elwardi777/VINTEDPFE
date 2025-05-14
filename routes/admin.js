import express from 'express';
const router = express.Router();
import { db } from '../index.js'; // Import the db connection from server.js
import { verifyAdmin } from '../middleware/authAdmin.js';

// Get all users
router.get('/api/users', (req, res) => {
  const sql = 'SELECT id, username, email, createdAt AS createdAt FROM users';

  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ success: false, message: 'Error fetching users' });
    }

    const usersWithAvatars = result.map(user => ({
      ...user,
      avatar: `https://i.pravatar.cc/150?u=${user.id}`
    }));

    res.status(200).json(usersWithAvatars);
  });
});

// Delete a user
router.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'DELETE FROM users WHERE id = ?';

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).json({ success: false, message: 'Error deleting user' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  });
});

// Delete a product
router.delete('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  const query = 'DELETE FROM products WHERE id = ?';

  db.query(query, [productId], (err, result) => {
    if (err) {
      console.error('Error deleting product:', err);
      return res.status(500).json({ success: false, message: 'Error deleting product' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  });
});

// Get all orders
router.get('/api/orders', (req, res) => {
  const sql = `
    SELECT 
      o.id, 
      o.user_id AS userId, 
      o.userName AS username, 
      o.items, 
      o.total, 
      o.status, 
      o.createdAt
    FROM orders o
    JOIN users u ON o.user_id = u.id
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error fetching orders:', err);
      return res.status(500).json({ success: false, message: 'Error fetching orders' });
    }

    // Parse items JSON for each order
    const orders = result.map(order => {
      let items = [];
      try {
        items = order.items ? JSON.parse(order.items) : [];
        if (!Array.isArray(items)) {
          items = [];
        }
      } catch (parseErr) {
        console.error(`Error parsing items for order ${order.id}:`, parseErr);
      }

      return {
        id: order.id,
        userId: order.userId,
        username: order.username,
        items,
        total: parseFloat(order.total) || 0,
        status: order.status,
        createdAt: order.createdAt
      };
    });

    res.status(200).json(orders);
  });
});



// Create a new order
router.post('/api/orders', (req, res) => {
  const { userId, userName, items, total, status } = req.body;

  // Validate request body
  if (!userId || !userName || !items || !total || !status) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  // Ensure items is a valid JSON string
  let itemsJson;
  try {
    itemsJson = JSON.stringify(items);
  } catch (error) {
    console.error('Error stringifying items:', error);
    return res.status(400).json({ success: false, message: 'Invalid items format' });
  }

  const query = `
    INSERT INTO orders (user_id, userName, items, total, status, createdAt)
    VALUES (?, ?, ?, ?, ?, NOW())
  `;
  const values = [userId, userName, itemsJson, total, status];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error creating order:', err);
      return res.status(500).json({ success: false, message: 'Error creating order' });
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: result.insertId
    });
  });
});

router.get('/admin', verifyAdmin, (req, res) => {
  res.status(200).json({ message: 'Welcome admin!' });
});

export default router;