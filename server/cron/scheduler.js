const cron = require('node-cron');
const { getLeads, getTasks, getUsers, createActivityLog } = require('../models/db');
const { sendWhatsAppNotification } = require('../services/whatsapp');

class SchedulerService {
    constructor() {
        this.tasks = [];
        this.isRunning = false;
    }
    
    start() {
        if (this.isRunning) {
            console.log('Scheduler already running');
            return;
        }
        
        console.log('Starting cron jobs...');
        
        // Daily summary at 9:00 AM IST
        const dailySummaryJob = cron.schedule('0 9 * * *', async () => {
            console.log('Running daily summary job...');
            await this.sendDailySummary();
        }, {
            scheduled: true,
            timezone: 'Asia/Kolkata'
        });
        
        // Follow-up reminders at 9:00 AM IST
        const followUpReminderJob = cron.schedule('0 9 * * *', async () => {
            console.log('Running follow-up reminder job...');
            await this.sendFollowUpReminders();
        }, {
            scheduled: true,
            timezone: 'Asia/Kolkata'
        });
        
        // Overdue reminders at 9:00 AM IST
        const overdueReminderJob = cron.schedule('0 9 * * *', async () => {
            console.log('Running overdue reminder job...');
            await this.sendOverdueReminders();
        }, {
            scheduled: true,
            timezone: 'Asia/Kolkata'
        });
        
        // Compliance alerts every 24 hours at 10:00 AM IST
        const complianceAlertJob = cron.schedule('0 10 * * *', async () => {
            console.log('Running compliance alert job...');
            await this.sendComplianceAlerts();
        }, {
            scheduled: true,
            timezone: 'Asia/Kolkata'
        });
        
        this.tasks.push(dailySummaryJob, followUpReminderJob, overdueReminderJob, complianceAlertJob);
        this.isRunning = true;
        
        console.log('All cron jobs scheduled successfully');
    }
    
    stop() {
        this.tasks.forEach(task => task.stop());
        this.tasks = [];
        this.isRunning = false;
        console.log('All cron jobs stopped');
    }
    
    async sendDailySummary() {
        try {
            // Get today's stats
            const today = new Date().toISOString().split('T')[0];
            const allLeads = getLeads();
            
            const stats = {
                total: allLeads.length,
                open: allLeads.filter(l => l.status === 'Open').length,
                on_progress: allLeads.filter(l => l.status === 'On Progress').length,
                converted: allLeads.filter(l => l.status === 'Converted').length,
                lost: allLeads.filter(l => l.status === 'Lost').length
            };
            
            // Get pending call recordings
            const revisions = require('../models/db').db.revisions || [];
            const pendingRecordings = allLeads.filter(l => 
                ['Open', 'On Progress'].includes(l.status) &&
                !revisions.some(r => r.lead_id === l.id)
            ).length;
            
            // Get pending itineraries
            const pendingItineraries = revisions.filter(r => r.send_status === 'Pending').length;
            
            // Get admin phone
            const admin = getUsers().find(u => u.role === 'admin');
            
            if (admin?.whatsapp_official) {
                await sendWhatsAppNotification({
                    to: admin.whatsapp_official,
                    type: 'daily_summary',
                    data: {
                        date: today,
                        total: stats.total,
                        open: stats.open,
                        on_progress: stats.on_progress,
                        converted: stats.converted,
                        lost: stats.lost,
                        pending_recordings: pendingRecordings,
                        pending_itineraries: pendingItineraries
                    }
                });
            }
        } catch (error) {
            console.error('Error sending daily summary:', error);
        }
    }
    
    async sendFollowUpReminders() {
        try {
            // Get tasks due today
            const today = new Date().toISOString().split('T')[0];
            const tasks = getTasks({ status: 'Pending' }).filter(t => t.follow_up_date === today);
            
            for (const task of tasks) {
                const employee = getUsers().find(u => u.id === task.assigned_employee_id);
                const lead = getLeads().find(l => l.id === task.lead_id);
                
                if (employee?.whatsapp_personal) {
                    await sendWhatsAppNotification({
                        to: employee.whatsapp_personal,
                        type: 'follow_up_reminder',
                        data: {
                            lead_name: lead?.name || 'Unknown',
                            phone: lead?.phone
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error sending follow-up reminders:', error);
        }
    }
    
    async sendOverdueReminders() {
        try {
            // Get overdue tasks (24 hours past due date)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            const tasks = getTasks({ status: 'Pending' }).filter(t => t.follow_up_date < yesterdayStr);
            
            for (const task of tasks) {
                const employee = getUsers().find(u => u.id === task.assigned_employee_id);
                const lead = getLeads().find(l => l.id === task.lead_id);
                
                if (employee?.whatsapp_personal) {
                    await sendWhatsAppNotification({
                        to: employee.whatsapp_personal,
                        type: 'overdue_reminder',
                        data: {
                            lead_name: lead?.name || 'Unknown',
                            employee_name: employee.name,
                            due_date: task.follow_up_date
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error sending overdue reminders:', error);
        }
    }
    
    async sendComplianceAlerts() {
        try {
            // Get admin phone
            const admin = getUsers().find(u => u.role === 'admin');
            if (!admin?.whatsapp_official) return;
            
            const adminPhone = admin.whatsapp_official;
            const now = new Date();
            const allLeads = getLeads();
            const revisions = require('../models/db').db.revisions || [];
            const activityLogs = require('../models/db').db.activity_logs || [];
            
            // Leads with no call recording for more than 2 days
            const noRecordingLeads = allLeads.filter(l => {
                const hasRevision = revisions.some(r => r.lead_id === l.id);
                const daysSinceCreated = (now - new Date(l.created_at)) / (24 * 60 * 60 * 1000);
                return ['Open', 'On Progress'].includes(l.status) && !hasRevision && daysSinceCreated > 2;
            }).slice(0, 5);
            
            for (const lead of noRecordingLeads) {
                const employee = getUsers().find(u => u.id === lead.assigned_employee_id);
                await sendWhatsAppNotification({
                    to: adminPhone,
                    type: 'compliance_alert',
                    data: {
                        issue: 'No Call Recording',
                        lead_name: lead.name,
                        employee_name: employee?.name || 'Unassigned',
                        days: Math.floor((now - new Date(lead.created_at)) / (24 * 60 * 60 * 1000))
                    }
                });
            }
            
            // Inactive leads (no activity for 48+ hours)
            const inactiveLeads = allLeads.filter(l => {
                const logs = activityLogs.filter(log => log.lead_id === l.id);
                const lastActivity = logs.length > 0 
                    ? new Date(logs[logs.length - 1].timestamp) 
                    : new Date(l.created_at);
                const hoursInactive = (now - lastActivity) / (60 * 60 * 1000);
                return ['Open', 'On Progress'].includes(l.status) && hoursInactive > 48;
            }).slice(0, 5);
            
            for (const lead of inactiveLeads) {
                const employee = getUsers().find(u => u.id === lead.assigned_employee_id);
                const logs = activityLogs.filter(log => log.lead_id === lead.id);
                const lastActivity = logs.length > 0 
                    ? new Date(logs[logs.length - 1].timestamp) 
                    : new Date(lead.created_at);
                
                await sendWhatsAppNotification({
                    to: adminPhone,
                    type: 'compliance_alert',
                    data: {
                        issue: 'Inactive Lead',
                        lead_name: lead.name,
                        employee_name: employee?.name || 'Unassigned',
                        days: Math.floor((now - lastActivity) / (24 * 60 * 60 * 1000))
                    }
                });
            }
        } catch (error) {
            console.error('Error sending compliance alerts:', error);
        }
    }
}

// Create singleton instance
const schedulerService = new SchedulerService();

module.exports = schedulerService;
