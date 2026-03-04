const express = require('express');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

/*
|--------------------------------------------------------------------------
| Upload Recording
|--------------------------------------------------------------------------
*/
router.post('/recording', authMiddleware, upload.single('recording'), (req, res) => {
    res.json({
        message: 'Recording uploaded successfully',
        file_url: `/uploads/${req.file.filename}`
    });
});

/*
|--------------------------------------------------------------------------
| Upload Document
|--------------------------------------------------------------------------
*/
router.post('/document', authMiddleware, upload.single('document'), (req, res) => {
    res.json({
        message: 'Document uploaded successfully',
        file_url: `/uploads/${req.file.filename}`
    });
});

module.exports = router;