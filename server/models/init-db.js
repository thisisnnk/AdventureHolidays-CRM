require('dotenv').config();

const db = require('./db');
const bcrypt = require('bcryptjs');

const initDatabase = async () => {
    try {
        console.log('Initializing PostgreSQL database...');

        const adminEmail =
            process.env.ADMIN_EMAIL || 'admin@adventureholidays.com';
        const adminPassword =
            process.env.ADMIN_PASSWORD || 'admin123';

        // 🔍 Check if admin exists
        const existingUser = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [adminEmail]
        );

        if (existingUser.rows.length === 0) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            await db.query(
                `INSERT INTO users 
        (name, email, password_hash, role, whatsapp_official, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    'System Admin',
                    adminEmail,
                    hashedPassword,
                    'admin',
                    process.env.WHATSAPP_SENDER || '+919600479189',
                    true
                ]
            );

            console.log('✅ Default admin user created:', adminEmail);
        } else {
            console.log('ℹ️ Admin user already exists:', adminEmail);
        }

        console.log('✅ Database initialization complete');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error initializing database:', error);
        process.exit(1);
    }
};

initDatabase();