const TelegramBot = require('node-telegram-bot-api');
const { createLead, createActivityLog, getUsers } = require('../models/db');
const { sendWhatsAppNotification } = require('./whatsapp');
const { processImageOCR } = require('./ocr');
require('dotenv').config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

class TelegramBotService {
    constructor() {
        this.bot = null;
        this.userSessions = new Map(); // Store user sessions
        
        if (TOKEN && TOKEN !== 'your_telegram_bot_token') {
            this.initializeBot();
        } else {
            console.log('Telegram bot token not configured. Bot will not be started.');
        }
    }
    
    initializeBot() {
        try {
            this.bot = new TelegramBot(TOKEN, { polling: true });
            console.log('Telegram bot initialized successfully');
            
            this.setupHandlers();
        } catch (error) {
            console.error('Error initializing Telegram bot:', error);
        }
    }
    
    setupHandlers() {
        // Handle /start command
        this.bot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            this.bot.sendMessage(chatId, 
                `👋 Welcome to Adventure Holidays Lead Bot!\n\n` +
                `I can help you create leads quickly.\n\n` +
                `Commands:\n` +
                `/newlead - Create a new lead manually\n` +
                `Send me a photo of a business card or enquiry screenshot and I'll extract the details automatically!`
            );
        });
        
        // Handle /newlead command
        this.bot.onText(/\/newlead/, (msg) => {
            const chatId = msg.chat.id;
            this.startNewLeadFlow(chatId);
        });
        
        // Handle photo uploads
        this.bot.on('photo', async (msg) => {
            const chatId = msg.chat.id;
            await this.handlePhotoUpload(msg);
        });
        
        // Handle text messages
        this.bot.on('message', async (msg) => {
            const chatId = msg.chat.id;
            
            // Skip if it's a command or photo
            if (msg.text?.startsWith('/') || msg.photo) return;
            
            // Handle session-based conversations
            await this.handleTextMessage(msg);
        });
        
        // Handle callback queries (button clicks)
        this.bot.on('callback_query', async (query) => {
            await this.handleCallbackQuery(query);
        });
    }
    
    startNewLeadFlow(chatId) {
        this.userSessions.set(chatId, {
            step: 'name',
            data: {}
        });
        
        this.bot.sendMessage(chatId, 'Please enter the lead name:');
    }
    
    async handleTextMessage(msg) {
        const chatId = msg.chat.id;
        const text = msg.text;
        const session = this.userSessions.get(chatId);
        
        if (!session) return;
        
        switch (session.step) {
            case 'name':
                session.data.name = text;
                session.step = 'phone';
                this.bot.sendMessage(chatId, 'Please enter the phone number:');
                break;
                
            case 'phone':
                session.data.phone = text;
                session.step = 'destination';
                this.bot.sendMessage(chatId, 'Please enter the destination (or type "skip"):');
                break;
                
            case 'destination':
                session.data.destination = text === 'skip' ? null : text;
                session.step = 'travelers';
                this.bot.sendMessage(chatId, 'Please enter the number of travelers (or type "skip"):');
                break;
                
            case 'travelers':
                session.data.travelers = text === 'skip' ? null : parseInt(text) || null;
                session.step = 'confirm';
                
                const confirmMessage = `Please confirm the details:\n\n` +
                    `Name: ${session.data.name}\n` +
                    `Phone: ${session.data.phone}\n` +
                    `Destination: ${session.data.destination || 'N/A'}\n` +
                    `Travelers: ${session.data.travelers || 'N/A'}\n\n` +
                    `Reply:\n` +
                    `1 - Yes, Confirm\n` +
                    `2 - Edit manually`;
                
                this.bot.sendMessage(chatId, confirmMessage);
                break;
                
            case 'confirm':
                if (text === '1') {
                    await this.createLeadFromBot(chatId, session.data);
                    this.userSessions.delete(chatId);
                } else if (text === '2') {
                    session.step = 'name';
                    this.bot.sendMessage(chatId, 'Let\'s start over. Please enter the lead name:');
                } else {
                    this.bot.sendMessage(chatId, 'Please reply with 1 to confirm or 2 to edit.');
                }
                break;
                
            case 'edit_name':
                session.data.name = text;
                session.step = 'edit_phone';
                this.bot.sendMessage(chatId, 'Please enter the correct phone number:');
                break;
                
            case 'edit_phone':
                session.data.phone = text;
                await this.createLeadFromBot(chatId, session.data);
                this.userSessions.delete(chatId);
                break;
        }
    }
    
    async handlePhotoUpload(msg) {
        const chatId = msg.chat.id;
        
        try {
            // Get the largest photo
            const photo = msg.photo[msg.photo.length - 1];
            const fileId = photo.file_id;
            
            // Download the file
            const fileUrl = await this.bot.getFileLink(fileId);
            
            // Process OCR
            this.bot.sendMessage(chatId, '🔍 Processing image... Please wait.');
            
            const ocrResult = await processImageOCR(fileUrl);
            
            if (ocrResult.success && (ocrResult.name || ocrResult.phone)) {
                // Store in session for confirmation
                this.userSessions.set(chatId, {
                    step: 'ocr_confirm',
                    data: {
                        name: ocrResult.name || 'Unknown',
                        phone: ocrResult.phone || 'Unknown',
                        destination: ocrResult.destination || null
                    },
                    ocrData: ocrResult
                });
                
                const confirmMessage = `✅ *Detected Details:*\n\n` +
                    `Name: ${ocrResult.name || 'Not detected'}\n` +
                    `Phone: ${ocrResult.phone || 'Not detected'}\n\n` +
                    `Is this correct?\n` +
                    `Reply *1* — Yes, Confirm\n` +
                    `Reply *2* — Edit manually`;
                
                this.bot.sendMessage(chatId, confirmMessage, { parse_mode: 'Markdown' });
            } else {
                this.bot.sendMessage(chatId, 
                    '❌ Could not detect details from the image.\n\n' +
                    'Please use /newlead to create a lead manually.'
                );
            }
        } catch (error) {
            console.error('Error handling photo upload:', error);
            this.bot.sendMessage(chatId, '❌ Error processing image. Please try again or use /newlead.');
        }
    }
    
    async handleCallbackQuery(query) {
        const chatId = query.message.chat.id;
        const data = query.data;
        
        // Answer the callback query
        this.bot.answerCallbackQuery(query.id);
        
        // Handle based on callback data
        if (data === 'confirm_ocr') {
            const session = this.userSessions.get(chatId);
            if (session && session.ocrData) {
                await this.createLeadFromBot(chatId, session.data);
                this.userSessions.delete(chatId);
            }
        } else if (data === 'edit_ocr') {
            this.userSessions.set(chatId, {
                step: 'edit_name',
                data: this.userSessions.get(chatId)?.data || {}
            });
            this.bot.sendMessage(chatId, 'Please enter the correct name:');
        }
    }
    
    async createLeadFromBot(chatId, data) {
        try {
            // Create lead in database
            const newLead = createLead({
                name: data.name,
                phone: data.phone,
                destination: data.destination,
                travelers: data.travelers,
                enquiry_date: new Date().toISOString().split('T')[0],
                lead_source: 'Telegram Bot',
                status: 'Open'
            });
            
            // Log activity
            createActivityLog({
                lead_id: newLead.id,
                action: 'LEAD_CREATED_VIA_TELEGRAM',
                details: JSON.stringify({ name: data.name, phone: data.phone })
            });
            
            // Send confirmation to user
            this.bot.sendMessage(chatId,
                `✅ *Lead Created Successfully!*\n\n` +
                `Name: ${data.name}\n` +
                `Phone: ${data.phone}\n` +
                `Lead ID: ${newLead.id}\n\n` +
                `An admin will assign this lead to an employee soon.`,
                { parse_mode: 'Markdown' }
            );
            
            // Send WhatsApp notification to admin
            const admin = getUsers().find(u => u.role === 'admin');
            if (admin?.whatsapp_official) {
                await sendWhatsAppNotification({
                    to: admin.whatsapp_official,
                    type: 'telegram_lead_notification',
                    data: {
                        name: data.name,
                        phone: data.phone,
                        timestamp: new Date().toLocaleString()
                    }
                });
            }
            
            console.log(`Lead created via Telegram Bot: ${data.name} - ${data.phone}`);
            
        } catch (error) {
            console.error('Error creating lead from bot:', error);
            this.bot.sendMessage(chatId, '❌ Error creating lead. Please try again later.');
        }
    }
    
    // Send message to a specific chat
    async sendMessage(chatId, message) {
        if (this.bot) {
            return this.bot.sendMessage(chatId, message);
        }
    }
    
    // Stop the bot
    stop() {
        if (this.bot) {
            this.bot.stopPolling();
            console.log('Telegram bot stopped');
        }
    }
}

// Create singleton instance
const telegramBotService = new TelegramBotService();

module.exports = telegramBotService;
