const express = require('express');
const db = require('../models/db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/* ================================
   GET ALL LEADS
================================ */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM leads ORDER BY created_at DESC'
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/* ================================
   GET LEAD BY ID
================================ */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'SELECT * FROM leads WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Get lead error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/* ================================
   CREATE LEAD
================================ */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            destination,
            status = 'Open'
        } = req.body;

        const result = await db.query(
            `INSERT INTO leads 
            (name, phone, email, destination, status)
            VALUES ($1,$2,$3,$4,$5)
            RETURNING *`,
            [name, phone, email, destination, status]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Create lead error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/* ================================
   UPDATE LEAD
================================ */
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, destination, status } = req.body;

        const result = await db.query(
            `UPDATE leads SET
            name = $1,
            phone = $2,
            email = $3,
            destination = $4,
            status = $5
            WHERE id = $6
            RETURNING *`,
            [name, phone, email, destination, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Update lead error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/* ================================
   DELETE LEAD
================================ */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        await db.query(
            'DELETE FROM leads WHERE id = $1',
            [id]
        );

        res.json({ message: 'Lead deleted successfully' });

    } catch (error) {
        console.error('Delete lead error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;