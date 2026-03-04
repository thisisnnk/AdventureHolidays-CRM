-- Adventure Holidays CRM Database Schema

-- Users table (Admin and Employees)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'employee')),
    whatsapp_personal VARCHAR(20),
    whatsapp_official VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    contact_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    email VARCHAR(100),
    city VARCHAR(50),
    state VARCHAR(50),
    country VARCHAR(50),
    total_trips INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    city VARCHAR(50),
    state VARCHAR(50),
    country VARCHAR(50),
    destination VARCHAR(200),
    travelers INTEGER,
    duration VARCHAR(50),
    enquiry_date DATE DEFAULT CURRENT_DATE,
    lead_source VARCHAR(50) CHECK (lead_source IN ('Instagram', 'Website', 'Referral', 'Office Direct Lead', 'Telegram Bot')),
    assigned_employee_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'On Progress', 'Lost', 'Converted')),
    itinerary_code VARCHAR(50),
    contact_id INTEGER REFERENCES contacts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Revisions table (immutable after insert)
CREATE TABLE IF NOT EXISTS revisions (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    call_recording_url TEXT NOT NULL,
    notes TEXT NOT NULL,
    itinerary_link TEXT NOT NULL,
    date_sent DATE,
    send_status VARCHAR(20) DEFAULT 'Pending' CHECK (send_status IN ('Sent', 'Pending')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lead_id, revision_number)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    follow_up_date DATE NOT NULL,
    assigned_employee_id INTEGER NOT NULL REFERENCES users(id),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Overdue')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Activity logs table (append-only)
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    recipient_user_id INTEGER NOT NULL REFERENCES users(id),
    lead_id INTEGER REFERENCES leads(id),
    message TEXT NOT NULL,
    sent_via VARCHAR(20) CHECK (sent_via IN ('whatsapp', 'telegram', 'email', 'in_app')),
    sent_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_assigned_employee ON leads(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_enquiry_date ON leads(enquiry_date);
CREATE INDEX IF NOT EXISTS idx_revisions_lead_id ON revisions(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_employee ON tasks(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_follow_up_date ON tasks(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_lead_id ON activity_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate contact ID
CREATE OR REPLACE FUNCTION generate_contact_id()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(2);
    month_part VARCHAR(2);
    seq_num INTEGER;
    new_contact_id VARCHAR(20);
BEGIN
    year_part := RIGHT(CAST(EXTRACT(YEAR FROM CURRENT_DATE) AS VARCHAR), 2);
    month_part := LPAD(CAST(EXTRACT(MONTH FROM CURRENT_DATE) AS VARCHAR), 2, '0');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(contact_id FROM 7) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM contacts
    WHERE contact_id LIKE 'AH' || year_part || month_part || '%';
    
    new_contact_id := 'AH' || year_part || month_part || LPAD(CAST(seq_num AS VARCHAR), 3, '0');
    NEW.contact_id := new_contact_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_contact_id BEFORE INSERT ON contacts
    FOR EACH ROW EXECUTE FUNCTION generate_contact_id();

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO activity_logs (lead_id, user_id, action, details)
        VALUES (NEW.id, NULL, 'LEAD_CREATED', json_build_object('name', NEW.name, 'phone', NEW.phone)::text);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO activity_logs (lead_id, user_id, action, details)
        VALUES (NEW.id, NULL, 'LEAD_UPDATED', json_build_object('status_changed', OLD.status IS DISTINCT FROM NEW.status)::text);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_lead_activity AFTER INSERT OR UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION log_activity();
