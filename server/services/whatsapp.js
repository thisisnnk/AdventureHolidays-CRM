const twilio = require('twilio');
require('dotenv').config();

// Initialize Twilio client
let client = null;
try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && 
        process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
        client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
} catch (error) {
    console.log('Twilio not configured:', error.message);
}

const WHATSAPP_SENDER = process.env.WHATSAPP_SENDER || '+919600479189';

// Message templates
const templates = {
    new_lead_assignment: (data) => ({
        body: `🎯 *New Lead Assigned — Adventure Holidays*

Lead Name: ${data.name}
Phone: ${data.phone}
Destination: ${data.destination || 'N/A'}
Enquiry Date: ${data.enquiry_date}
Assigned By: Admin

Please log in to update status and upload call recording.`
    }),
    
    new_task: (data) => ({
        body: `📋 *New Task Assigned — Adventure Holidays*

Lead: ${data.lead_name}
Task: ${data.description}
Follow-Up Date: ${data.follow_up_date}
Notes: ${data.notes || 'N/A'}

Please complete this task before the due date.`
    }),
    
    follow_up_reminder: (data) => ({
        body: `⏰ *Follow-Up Reminder — Adventure Holidays*

Lead: ${data.lead_name}
Phone: ${data.phone}
Follow-Up Due: Today

Please contact this lead and update the CRM.`
    }),
    
    overdue_reminder: (data) => ({
        body: `🚨 *OVERDUE FOLLOW-UP — Adventure Holidays*

Lead: ${data.lead_name}
Employee: ${data.employee_name}
Due Date: ${data.due_date}
Status: OVERDUE

Immediate action required.`
    }),
    
    compliance_alert: (data) => ({
        body: `⚠️ *Compliance Alert — Adventure Holidays*

Issue: ${data.issue}
Lead: ${data.lead_name}
Employee: ${data.employee_name}
Days Since Assignment: ${data.days}

Please review immediately.`
    }),
    
    daily_summary: (data) => ({
        body: `📊 *Daily Lead Summary — Adventure Holidays*

Date: ${data.date}
Total Leads: ${data.total}
Open: ${data.open}
On Progress: ${data.on_progress}
Converted: ${data.converted}
Lost: ${data.lost}
Pending Call Recordings: ${data.pending_recordings}
Pending Itineraries: ${data.pending_itineraries}`
    }),
    
    lead_converted: (data) => ({
        body: `✅ *Lead Converted — Adventure Holidays*

Lead Name: ${data.name}
Phone: ${data.phone}
Destination: ${data.destination || 'N/A'}

The lead has been successfully converted!`
    }),
    
    telegram_lead_notification: (data) => ({
        body: `🆕 *New Lead via Telegram Bot*

Name: ${data.name}
Phone: ${data.phone}
Source: Telegram Bot
Time: ${data.timestamp}
Assigned: Unassigned (Pending Admin)

Please assign this lead to an employee.`
    })
};

const sendWhatsAppNotification = async ({ to, type, data }) => {
    try {
        // Format phone number
        let formattedPhone = to.replace(/\s/g, '').replace(/^0/, '');
        if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+' + formattedPhone;
        }
        
        const template = templates[type];
        if (!template) {
            console.error(`Unknown notification type: ${type}`);
            return { success: false, error: 'Unknown notification type' };
        }
        
        const message = template(data);
        
        // If Twilio is not configured, log the message
        if (!client) {
            console.log('=== WhatsApp Notification (Twilio not configured) ===');
            console.log(`To: ${formattedPhone}`);
            console.log(`From: ${WHATSAPP_SENDER}`);
            console.log(`Message: ${message.body}`);
            console.log('====================================================');
            return { success: true, message: 'Logged (Twilio not configured)' };
        }
        
        // Send via Twilio
        const result = await client.messages.create({
            from: `whatsapp:${WHATSAPP_SENDER}`,
            to: `whatsapp:${formattedPhone}`,
            body: message.body
        });
        
        console.log(`WhatsApp message sent: ${result.sid}`);
        return { success: true, messageId: result.sid };
    } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
        return { success: false, error: error.message };
    }
};

// Send bulk notifications
const sendBulkNotifications = async (recipients, type, data) => {
    const results = [];
    for (const recipient of recipients) {
        const result = await sendWhatsAppNotification({
            to: recipient.phone,
            type,
            data: { ...data, ...recipient }
        });
        results.push({ recipient: recipient.phone, result });
    }
    return results;
};

module.exports = {
    sendWhatsAppNotification,
    sendBulkNotifications,
    WHATSAPP_SENDER
};
