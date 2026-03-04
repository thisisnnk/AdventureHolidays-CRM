const fs = require('fs');
const path = require('path');

// In-memory database for demonstration
// In production, use PostgreSQL

const DB_FILE = path.join(__dirname, '../../data/db.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Load or initialize database
let db = {
    users: [],
    contacts: [],
    leads: [],
    revisions: [],
    tasks: [],
    activity_logs: [],
    notifications: []
};

if (fs.existsSync(DB_FILE)) {
    try {
        db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        console.log('Could not load DB file, starting fresh');
    }
}

// Save database to file
const saveDb = () => {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
};

// Query function that mimics PostgreSQL interface
const query = async (sql, params = []) => {
    // This is a simplified mock - in production use real PostgreSQL
    console.log('Query:', sql.substring(0, 100), 'Params:', params);
    return { rows: [] };
};

// Get next ID for a table
const getNextId = (table) => {
    const items = db[table] || [];
    return items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
};

// CRUD operations
const dbOperations = {
    // Users
    getUsers: () => db.users,
    getUserById: (id) => db.users.find(u => u.id === id),
    getUserByEmail: (email) => db.users.find(u => u.email === email),
    createUser: (user) => {
        const newUser = { ...user, id: getNextId('users'), created_at: new Date().toISOString() };
        db.users.push(newUser);
        saveDb();
        return newUser;
    },
    updateUser: (id, data) => {
        const idx = db.users.findIndex(u => u.id === id);
        if (idx >= 0) {
            db.users[idx] = { ...db.users[idx], ...data, updated_at: new Date().toISOString() };
            saveDb();
            return db.users[idx];
        }
        return null;
    },
    deleteUser: (id) => {
        const idx = db.users.findIndex(u => u.id === id);
        if (idx >= 0) {
            db.users.splice(idx, 1);
            saveDb();
            return true;
        }
        return false;
    },

    // Leads
    getLeads: (filter = {}) => {
        let leads = db.leads;
        if (filter.status) leads = leads.filter(l => l.status === filter.status);
        if (filter.assigned_employee_id) leads = leads.filter(l => l.assigned_employee_id === filter.assigned_employee_id);
        if (filter.search) {
            const search = filter.search.toLowerCase();
            leads = leads.filter(l => l.name.toLowerCase().includes(search) || l.phone.includes(search));
        }
        return leads;
    },
    getLeadById: (id) => db.leads.find(l => l.id === id),
    createLead: (lead) => {
        const itineraryCode = `ITN${Date.now().toString(36).toUpperCase()}`;
        const newLead = {
            ...lead,
            id: getNextId('leads'),
            itinerary_code: itineraryCode,
            status: lead.status || 'Open',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        db.leads.push(newLead);
        saveDb();
        return newLead;
    },
    updateLead: (id, data) => {
        const idx = db.leads.findIndex(l => l.id === id);
        if (idx >= 0) {
            db.leads[idx] = { ...db.leads[idx], ...data, updated_at: new Date().toISOString() };
            saveDb();
            return db.leads[idx];
        }
        return null;
    },
    deleteLead: (id) => {
        const idx = db.leads.findIndex(l => l.id === id);
        if (idx >= 0) {
            db.leads.splice(idx, 1);
            saveDb();
            return true;
        }
        return false;
    },

    // Contacts
    getContacts: (filter = {}) => {
        let contacts = db.contacts;
        if (filter.search) {
            const search = filter.search.toLowerCase();
            contacts = contacts.filter(c =>
                c.name.toLowerCase().includes(search) ||
                c.phone.includes(search) ||
                c.contact_id.toLowerCase().includes(search)
            );
        }
        return contacts;
    },
    getContactById: (id) => db.contacts.find(c => c.id === id),
    createContact: (contact) => {
        // Generate contact ID: AHYYMMXXX
        const now = new Date();
        const yy = now.getFullYear().toString().slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const sameMonthContacts = db.contacts.filter(c => c.contact_id && c.contact_id.startsWith(`AH${yy}${mm}`));
        const seq = String(sameMonthContacts.length + 1).padStart(3, '0');
        const contactId = `AH${yy}${mm}${seq}`;

        const newContact = {
            ...contact,
            id: getNextId('contacts'),
            contact_id: contactId,
            total_trips: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        db.contacts.push(newContact);
        saveDb();
        return newContact;
    },
    updateContact: (id, data) => {
        const idx = db.contacts.findIndex(c => c.id === id);
        if (idx >= 0) {
            db.contacts[idx] = { ...db.contacts[idx], ...data, updated_at: new Date().toISOString() };
            saveDb();
            return db.contacts[idx];
        }
        return null;
    },
    deleteContact: (id) => {
        const idx = db.contacts.findIndex(c => c.id === id);
        if (idx >= 0) {
            db.contacts.splice(idx, 1);
            saveDb();
            return true;
        }
        return false;
    },

    // Revisions
    getRevisionsByLeadId: (leadId) => db.revisions.filter(r => r.lead_id === leadId).sort((a, b) => a.revision_number - b.revision_number),
    createRevision: (revision) => {
        const leadRevisions = db.revisions.filter(r => r.lead_id === revision.lead_id);
        const newRevision = {
            ...revision,
            id: getNextId('revisions'),
            revision_number: leadRevisions.length + 1,
            created_at: new Date().toISOString()
        };
        db.revisions.push(newRevision);
        saveDb();
        return newRevision;
    },
    updateRevision: (id, data) => {
        const idx = db.revisions.findIndex(r => r.id === id);
        if (idx >= 0) {
            db.revisions[idx] = { ...db.revisions[idx], ...data };
            saveDb();
            return db.revisions[idx];
        }
        return null;
    },

    // Tasks
    getTasks: (filter = {}) => {
        let tasks = db.tasks;
        if (filter.status) tasks = tasks.filter(t => t.status === filter.status);
        if (filter.lead_id) tasks = tasks.filter(t => t.lead_id === filter.lead_id);
        if (filter.assigned_employee_id) tasks = tasks.filter(t => t.assigned_employee_id === filter.assigned_employee_id);
        return tasks;
    },
    getTaskById: (id) => db.tasks.find(t => t.id === id),
    createTask: (task) => {
        const newTask = {
            ...task,
            id: getNextId('tasks'),
            status: task.status || 'Pending',
            created_at: new Date().toISOString()
        };
        db.tasks.push(newTask);
        saveDb();
        return newTask;
    },
    updateTask: (id, data) => {
        const idx = db.tasks.findIndex(t => t.id === id);
        if (idx >= 0) {
            db.tasks[idx] = { ...db.tasks[idx], ...data };
            if (data.status === 'Completed' && !db.tasks[idx].completed_at) {
                db.tasks[idx].completed_at = new Date().toISOString();
            }
            saveDb();
            return db.tasks[idx];
        }
        return null;
    },
    deleteTask: (id) => {
        const idx = db.tasks.findIndex(t => t.id === id);
        if (idx >= 0) {
            db.tasks.splice(idx, 1);
            saveDb();
            return true;
        }
        return false;
    },

    // Activity Logs
    getActivityLogs: (leadId) => db.activity_logs.filter(l => l.lead_id === leadId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    createActivityLog: (log) => {
        const newLog = {
            ...log,
            id: getNextId('activity_logs'),
            timestamp: new Date().toISOString()
        };
        db.activity_logs.push(newLog);
        saveDb();
        return newLog;
    },

    // Raw query for compatibility
    query: async (sql, params) => query(sql, params)
};

console.log('Using file-based JSON database for demonstration');

module.exports = {
    query,
    pool: { query },
    ...dbOperations,
    db
};