const { createActivityLog } = require('../models/db');

/**
 * Log an activity
 * @param {number} leadId - Lead ID
 * @param {number} userId - User ID who performed the action
 * @param {string} action - Action type
 * @param {object} details - Additional details
 */
const logActivity = async (leadId, userId, action, details = {}) => {
    try {
        createActivityLog({
            lead_id: leadId,
            user_id: userId,
            action,
            details: JSON.stringify(details)
        });
        console.log(`Activity logged: ${action} for lead ${leadId}`);
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

/**
 * Get activity logs for a lead
 * @param {number} leadId - Lead ID
 * @param {number} limit - Number of logs to retrieve
 * @returns {Promise<Array>}
 */
const getActivityLogs = async (leadId, limit = 50) => {
    try {
        const { getActivityLogs: getLogs } = require('../models/db');
        return getLogs(leadId).slice(0, limit);
    } catch (error) {
        console.error('Error getting activity logs:', error);
        return [];
    }
};

module.exports = {
    logActivity,
    getActivityLogs
};
