const express = require('express');
const db = require('../models/db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET ALL TASKS
|--------------------------------------------------------------------------
*/
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM tasks ORDER BY created_at DESC'
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/*
|--------------------------------------------------------------------------
| CREATE TASK
|--------------------------------------------------------------------------
*/
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            lead_id,
            description,
            follow_up_date,
            assigned_employee_id,
            notes
        } = req.body;

        const result = await db.query(
            `INSERT INTO tasks
            (lead_id, description, follow_up_date, assigned_employee_id, notes)
            VALUES ($1,$2,$3,$4,$5)
            RETURNING *`,
            [
                lead_id,
                description,
                follow_up_date,
                assigned_employee_id,
                notes
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/*
|--------------------------------------------------------------------------
| UPDATE TASK STATUS
|--------------------------------------------------------------------------
*/
router.patch('/:id/status', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const result = await db.query(
            `UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *`,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/*
|--------------------------------------------------------------------------
| DELETE TASK
|--------------------------------------------------------------------------
*/
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        await db.query(
            'DELETE FROM tasks WHERE id = $1',
            [id]
        );

        res.json({ message: 'Task deleted successfully' });

    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;