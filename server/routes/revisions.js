const express = require('express');
const db = require('../models/db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET REVISIONS BY LEAD ID
|--------------------------------------------------------------------------
*/
router.get('/lead/:leadId', authMiddleware, async (req, res) => {
    try {
        const { leadId } = req.params;

        const result = await db.query(
            'SELECT * FROM revisions WHERE lead_id = $1 ORDER BY revision_number ASC',
            [leadId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Get revisions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/*
|--------------------------------------------------------------------------
| CREATE REVISION
|--------------------------------------------------------------------------
*/
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            lead_id,
            call_recording_url,
            notes,
            itinerary_link,
            date_sent,
            send_status
        } = req.body;

        if (!call_recording_url || !notes || !itinerary_link) {
            return res.status(400).json({
                message: 'Call recording, notes, and itinerary link are required'
            });
        }

        // Get next revision number
        const revisionResult = await db.query(
            'SELECT COUNT(*) FROM revisions WHERE lead_id = $1',
            [lead_id]
        );

        const revision_number = Number(revisionResult.rows[0].count) + 1;

        const result = await db.query(
            `INSERT INTO revisions
            (lead_id, revision_number, call_recording_url, notes, itinerary_link, date_sent, send_status)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *`,
            [
                lead_id,
                revision_number,
                call_recording_url,
                notes,
                itinerary_link,
                date_sent,
                send_status || 'Pending'
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Create revision error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;