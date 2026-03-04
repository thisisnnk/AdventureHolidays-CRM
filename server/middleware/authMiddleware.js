const jwt = require('jsonwebtoken');
const db = require('../models/db');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('Auth error: No token provided');
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const userId = Number(decoded.id);

        if (!userId || isNaN(userId)) {
            console.log('Auth error: Invalid ID in token');
            return res.status(401).json({ message: 'Invalid token.' });
        }

        const result = await db.query(
            'SELECT id, name, email, role FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            console.log('Auth error: User not found for ID:', userId);
            return res.status(401).json({ message: 'User not found.' });
        }

        req.user = result.rows[0];

        next();

    } catch (error) {
        console.log('Auth error:', error.message);
        return res.status(401).json({ message: 'Invalid token.' });
    }
};

module.exports = authMiddleware;