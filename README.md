# Adventure Holidays - Lead Management & Back Office CRM System

A comprehensive CRM system for Adventure Holidays to manage leads, contacts, employees, and track the entire sales pipeline with integrated Telegram Bot and WhatsApp notifications.

## Features

### Core Features
- **Role-Based Access Control**: Admin and Employee roles with different permissions
- **Lead Management**: Create, update, track leads through the sales pipeline
- **Contact Management**: Store and manage customer contacts with trip history
- **Revision Tracking**: Track itinerary revisions with mandatory call recordings
- **Task Management**: Follow-up tasks with due dates and reminders
- **Activity Logging**: Complete audit trail of all actions

### Integrations
- **Telegram Bot** (@ahleadbot): OCR-based lead intake from business cards/screenshots
- **WhatsApp Notifications**: Automated notifications via Twilio API
- **Cron Jobs**: Daily summaries, follow-up reminders, compliance alerts

### Dashboard & Analytics
- Lead summary cards (Total, Converted, Lost, On Progress, Open)
- Employee performance charts (Admin only)
- Compliance alerts (no call recording, overdue follow-ups, inactive leads)
- Task panel for employees

## Tech Stack

### Frontend
- React.js + TypeScript
- Tailwind CSS
- shadcn/ui components
- Recharts for analytics
- React Router for navigation

### Backend
- Node.js + Express.js
- PostgreSQL database
- JWT authentication
- Multer for file uploads
- Tesseract.js for OCR

### Integrations
- Telegram Bot API (node-telegram-bot-api)
- Twilio WhatsApp API
- Node-cron for scheduled tasks

## Project Structure

```
/ah-crm
├── /src                 → React frontend
│   ├── /components      → Reusable UI components
│   ├── /context         → React context (Auth)
│   ├── /hooks           → Custom React hooks
│   ├── /pages           → Page components
│   ├── /services        → API services
│   ├── /types           → TypeScript type definitions
│   └── App.tsx          → Main app component
├── /server              → Node.js backend
│   ├── /cron            → Scheduled jobs
│   ├── /middleware      → Auth & role middleware
│   ├── /models          → Database models & schema
│   ├── /routes          → API routes
│   ├── /services        → Business logic (WhatsApp, Telegram, OCR)
│   └── server.js        → Express server entry
├── /uploads             → File uploads (call recordings, documents)
└── .env                 → Environment variables
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/adventure_holidays_crm

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Telegram Bot
TELEGRAM_BOT_TOKEN=8483733498:AAFQ-_2IViqw5AkWHTNOYS-I0JfomrA6nVk

# WhatsApp (Twilio)
WHATSAPP_SENDER=+919600479189
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# File Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# App
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Admin Credentials
ADMIN_EMAIL=admin@adventureholidays.com
ADMIN_PASSWORD=admin123
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone and Install Dependencies

```bash
cd /mnt/okcomputer/output/app
npm install
```

### 2. Setup Database

```bash
# Create PostgreSQL database
createdb adventure_holidays_crm

# Initialize database schema and create admin user
npm run db:init
```

### 3. Start Development Server

```bash
# Start backend server
npm run server

# In a new terminal, start frontend dev server
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

### 4. Production Build

```bash
# Build frontend and start production server
npm start
```

## Default Login Credentials

- **Email**: admin@adventureholidays.com
- **Password**: admin123

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/employees` - List employees (Admin only)
- `POST /api/auth/employees` - Create employee (Admin only)

### Leads
- `GET /api/leads` - List leads
- `GET /api/leads/:id` - Get lead details
- `POST /api/leads` - Create lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead (Admin only)
- `GET /api/leads/stats/summary` - Get lead statistics
- `GET /api/leads/stats/employees` - Get employee performance (Admin only)
- `GET /api/leads/alerts/compliance` - Get compliance alerts (Admin only)

### Contacts
- `GET /api/contacts` - List contacts (Admin only)
- `GET /api/contacts/:id` - Get contact details (Admin only)
- `POST /api/contacts` - Create contact (Admin only)
- `PUT /api/contacts/:id` - Update contact (Admin only)
- `DELETE /api/contacts/:id` - Delete contact (Admin only)

### Revisions
- `GET /api/revisions/lead/:lead_id` - Get revisions for a lead
- `POST /api/revisions` - Create revision
- `PATCH /api/revisions/:id/send-status` - Update send status

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id/status` - Update task status
- `DELETE /api/tasks/:id` - Delete task (Admin only)

### Uploads
- `POST /api/uploads/recording` - Upload call recording
- `POST /api/uploads/document` - Upload document

## Business Rules

1. **Revision Creation**: All three fields are mandatory (call recording, itinerary link, notes)
2. **Revision Immutability**: Revisions cannot be edited or deleted after creation
3. **Role-Based Access**: Employees can only see their assigned leads
4. **Contacts Access**: Only Admin can access the Contacts module
5. **Contact ID Format**: Auto-generated as `AHYYMMXXX` (e.g., AH2602001)
6. **WhatsApp Sender**: All notifications sent from +919600479189

## Cron Jobs

- **Daily Summary**: Sent to Admin at 9:00 AM IST
- **Follow-up Reminders**: Sent to employees at 9:00 AM on due date
- **Overdue Reminders**: Sent 24 hours after due date
- **Compliance Alerts**: Sent every 24 hours for unresolved issues

## Telegram Bot Commands

- `/start` - Welcome message
- `/newlead` - Create a new lead manually
- Send photo - OCR-based lead creation from business cards

## License

Private - For Adventure Holidays Internal Use Only
