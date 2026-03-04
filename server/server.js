const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const leadsRoutes = require('./routes/leads');
const contactsRoutes = require('./routes/contacts');
const revisionsRoutes = require('./routes/revisions');
const tasksRoutes = require('./routes/tasks');
const uploadsRoutes = require('./routes/uploads');

const telegramBotService = require('./services/telegramBot');
const schedulerService = require('./cron/scheduler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://adventure-holidays-crm.vercel.app"
    ],
    credentials: true
}));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/revisions', revisionsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/uploads', uploadsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            telegram: telegramBotService.bot ? 'running' : 'not configured',
            scheduler: schedulerService.isRunning ? 'running' : 'stopped'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File size too large' });
        }
        return res.status(400).json({ message: err.message });
    }
    
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`Adventure Holidays CRM Server`);
    console.log(`=================================`);
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=================================`);
    
    // Start scheduler
    schedulerService.start();
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    schedulerService.stop();
    telegramBotService.stop();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    schedulerService.stop();
    telegramBotService.stop();
    process.exit(0);
});

module.exports = app;
