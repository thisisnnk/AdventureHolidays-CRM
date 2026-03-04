import axios, {
    type AxiosError,
    type InternalAxiosRequestConfig
} from "axios";
import type { Lead, Contact } from "@/types";

/* =====================================================
   AXIOS INSTANCE
===================================================== */

const api = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json"
    }
});

/* =====================================================
   REQUEST INTERCEPTOR (Attach JWT)
===================================================== */

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem("token");

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/* =====================================================
   RESPONSE INTERCEPTOR (Handle 401)
===================================================== */

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

/* =====================================================
   AUTH API
===================================================== */

export const authApi = {
    login: (email: string, password: string) =>
        api.post("/auth/login", { email, password }),

    getMe: () =>
        api.get("/auth/me"),

    getEmployees: () =>
        api.get("/auth/employees"),

    createEmployee: (data: {
        name: string;
        email: string;
        password: string;
        whatsapp_personal?: string;
        whatsapp_official?: string;
    }) =>
        api.post("/auth/employees", data),

    updateEmployee: (
        id: number,
        data: {
            name: string;
            email: string;
            whatsapp_personal?: string;
            whatsapp_official?: string;
            is_active?: boolean;
        }
    ) =>
        api.put(`/auth/employees/${id}`, data),

    deleteEmployee: (id: number) =>
        api.delete(`/auth/employees/${id}`)
};

/* =====================================================
   LEADS API
===================================================== */

export const leadsApi = {
    getAll: (params?: {
        status?: string;
        assigned_employee_id?: number;
        date_from?: string;
        date_to?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) =>
        api.get("/leads", { params }),

    getById: (id: number) =>
        api.get(`/leads/${id}`),

    create: (data: Partial<Lead>) =>
        api.post("/leads", data),

    update: (id: number, data: Partial<Lead>) =>
        api.put(`/leads/${id}`, data),

    delete: (id: number) =>
        api.delete(`/leads/${id}`),

    getStats: (params?: { date_from?: string; date_to?: string }) =>
        api.get("/leads/stats/summary", { params }),

    getEmployeeStats: (params?: { date_from?: string; date_to?: string }) =>
        api.get("/leads/stats/employees", { params }),

    getComplianceAlerts: () =>
        api.get("/leads/alerts/compliance")
};

/* =====================================================
   CONTACTS API
===================================================== */

export const contactsApi = {
    getAll: (params?: {
        search?: string;
        page?: number;
        limit?: number;
    }) =>
        api.get("/contacts", { params }),

    getById: (id: number) =>
        api.get(`/contacts/${id}`),

    create: (data: Partial<Contact>) =>
        api.post("/contacts", data),

    update: (id: number, data: Partial<Contact>) =>
        api.put(`/contacts/${id}`, data),

    delete: (id: number) =>
        api.delete(`/contacts/${id}`),

    linkLead: (lead_id: number, contact_id: number) =>
        api.post("/contacts/link-lead", { lead_id, contact_id })
};

/* =====================================================
   REVISIONS API
===================================================== */

export const revisionsApi = {
    getByLeadId: (leadId: number) =>
        api.get(`/revisions/lead/${leadId}`),

    create: (data: {
        lead_id: number;
        call_recording_url: string;
        notes: string;
        itinerary_link: string;
        date_sent?: string;
        send_status?: string;
    }) =>
        api.post("/revisions", data),

    updateSendStatus: (id: number, send_status: string) =>
        api.patch(`/revisions/${id}/send-status`, { send_status })
};

/* =====================================================
   TASKS API
===================================================== */

export const tasksApi = {
    getAll: (params?: {
        status?: string;
        lead_id?: number;
        page?: number;
        limit?: number;
    }) =>
        api.get("/tasks", { params }),

    create: (data: {
        lead_id: number;
        description: string;
        follow_up_date: string;
        assigned_employee_id?: number;
        notes?: string;
    }) =>
        api.post("/tasks", data),

    updateStatus: (id: number, status: string) =>
        api.patch(`/tasks/${id}/status`, { status }),

    delete: (id: number) =>
        api.delete(`/tasks/${id}`)
};

/* =====================================================
   UPLOADS API
===================================================== */

export const uploadsApi = {
    uploadRecording: (file: File) => {
        const formData = new FormData();
        formData.append("recording", file);

        return api.post("/uploads/recording", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
    },

    uploadDocument: (file: File) => {
        const formData = new FormData();
        formData.append("document", file);

        return api.post("/uploads/document", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
    }
};

export default api;