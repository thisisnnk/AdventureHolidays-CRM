const express = require('express');
const db = require('../models/db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET ALL CONTACTS
|--------------------------------------------------------------------------
*/
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM contacts ORDER BY created_at DESC'
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/*
|--------------------------------------------------------------------------
| GET CONTACT BY ID
|--------------------------------------------------------------------------
*/
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'SELECT * FROM contacts WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Get contact error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/*
|--------------------------------------------------------------------------
| CREATE CONTACT
|--------------------------------------------------------------------------
*/
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            city,
            state,
            country
        } = req.body;

        const result = await db.query(
            `INSERT INTO contacts
            (name, phone, email, city, state, country)
            VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING *`,
            [name, phone, email, city, state, country]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Create contact error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/*
|--------------------------------------------------------------------------
| UPDATE CONTACT
|--------------------------------------------------------------------------
*/
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, city, state, country } = req.body;

        const result = await db.query(
            `UPDATE contacts SET
            name = $1,
            phone = $2,
            email = $3,
            city = $4,
            state = $5,
            country = $6
            WHERE id = $7
            RETURNING *`,
            [name, phone, email, city, state, country, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Update contact error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/*
|--------------------------------------------------------------------------
| DELETE CONTACT
|--------------------------------------------------------------------------
*/
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        await db.query(
            'DELETE FROM contacts WHERE id = $1',
            [id]
        );

        res.json({ message: 'Contact deleted successfully' });

    } catch (error) {
        console.error('Delete contact error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;