const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user by email
        const result = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                id: Number(user.id),  // 🔥 ensure number
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/*
|--------------------------------------------------------------------------
| GET CURRENT USER (/auth/me)
|--------------------------------------------------------------------------
*/
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 🔥 FIX: Ensure ID is a number
        const userId = Number(decoded.id);

        if (!userId || isNaN(userId)) {
            console.error('Invalid user ID in token:', decoded);
            return res.status(401).json({ message: 'Invalid token data' });
        }

        const result = await db.query(
            'SELECT id, name, email, role FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            console.error('User not found for ID:', userId);
            return res.status(401).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Auth /me error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

module.exports = router;