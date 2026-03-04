export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'employee';
    whatsapp_personal?: string;
    whatsapp_official?: string;
    is_active?: boolean;
    created_at?: string;
}

export interface Lead {
    id: number;
    name: string;
    phone: string;
    email?: string;
    city?: string;
    state?: string;
    country?: string;
    destination?: string;
    travelers?: number;
    duration?: string;
    enquiry_date: string;
    lead_source?: string;
    assigned_employee_id?: number;
    assigned_employee_name?: string;
    status: 'Open' | 'On Progress' | 'Lost' | 'Converted';
    itinerary_code?: string;
    contact_id?: number;
    contact_code?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Contact {
    id: number;
    contact_id: string;
    name: string;
    phone: string;
    whatsapp?: string;
    email?: string;
    city?: string;
    state?: string;
    country?: string;
    total_trips: number;
    created_at?: string;
    updated_at?: string;
}

export interface Revision {
    id: number;
    lead_id: number;
    revision_number: number;
    call_recording_url: string;
    notes: string;
    itinerary_link: string;
    date_sent?: string;
    send_status: 'Sent' | 'Pending';
    created_by?: number;
    created_by_name?: string;
    created_at?: string;
}

export interface Task {
    id: number;
    lead_id: number;
    lead_name?: string;
    description: string;
    follow_up_date: string;
    assigned_employee_id: number;
    assigned_employee_name?: string;
    notes?: string;
    status: 'Pending' | 'Completed' | 'Overdue';
    created_by?: number;
    created_at?: string;
    completed_at?: string;
}

export interface ActivityLog {
    id: number;
    lead_id: number;
    user_id?: number;
    user_name?: string;
    action: string;
    details?: string;
    timestamp: string;
}

export interface LeadStats {
    total_leads: string;
    open: string;
    on_progress: string;
    converted: string;
    lost: string;
}

export interface EmployeeStats {
    id: number;
    employee_name: string;
    total_leads: string;
    open: string;
    on_progress: string;
    converted: string;
    lost: string;
}

export interface ComplianceAlert {
    lead_id: number;
    lead_name: string;
    employee_name: string;
    assigned_employee_id: number;
    created_at?: string;
    days_since_assignment?: number;
    days_pending?: number;
    hours_inactive?: number;
    days_overdue?: number;
    task_description?: string;
    follow_up_date?: string;
    revision_number?: number;
    hours_pending?: number;
}

export interface ComplianceAlerts {
    no_call_recording: ComplianceAlert[];
    pending_itinerary: ComplianceAlert[];
    inactive_leads: ComplianceAlert[];
    overdue_followups: ComplianceAlert[];
    stalled_revisions: ComplianceAlert[];
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ApiResponse<T> {
    data?: T;
    message?: string;
    error?: string;
}
