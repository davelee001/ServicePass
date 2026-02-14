const nodemailer = require('nodemailer');
const twilio = require('twilio');
const admin = require('firebase-admin');
const { logger } = require('./logger');

class NotificationService {
    constructor() {
        this.emailTransporter = null;
        this.twilioClient = null;
        this.firebaseApp = null;
        this.initializeServices();
    }

    initializeServices() {
        // Initialize email service
        if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            this.emailTransporter = nodemailer.createTransporter({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            logger.info('Email service initialized');
        }

        // Initialize Twilio SMS service
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            this.twilioClient = twilio(
                process.env.TWILIO_ACCOUNT_SID, 
                process.env.TWILIO_AUTH_TOKEN
            );
            logger.info('Twilio SMS service initialized');
        }

        // Initialize Firebase for push notifications
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            try {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                this.firebaseApp = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                logger.info('Firebase push notification service initialized');
            } catch (error) {
                logger.error('Failed to initialize Firebase:', error);
            }
        }
    }

    async sendEmail({ to, subject, htmlContent, textContent }) {
        if (!this.emailTransporter) {
            throw new Error('Email service not configured');
        }

        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to,
                subject,
                html: htmlContent,
                text: textContent
            };

            const result = await this.emailTransporter.sendMail(mailOptions);
            logger.info(`Email sent successfully to ${to}`, { messageId: result.messageId });
            return result;
        } catch (error) {
            logger.error(`Failed to send email to ${to}:`, error);
            throw error;
        }
    }

    async sendSMS({ to, message }) {
        if (!this.twilioClient) {
            throw new Error('SMS service not configured');
        }

        try {
            const result = await this.twilioClient.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to
            });

            logger.info(`SMS sent successfully to ${to}`, { messageSid: result.sid });
            return result;
        } catch (error) {
            logger.error(`Failed to send SMS to ${to}:`, error);
            throw error;
        }
    }

    async sendPushNotification({ token, title, body, data = {} }) {
        if (!this.firebaseApp) {
            throw new Error('Push notification service not configured');
        }

        try {
            const message = {
                notification: {
                    title,
                    body
                },
                data,
                token
            };

            const result = await admin.messaging().send(message);
            logger.info(`Push notification sent successfully to ${token}`, { messageId: result });
            return result;
        } catch (error) {
            logger.error(`Failed to send push notification to ${token}:`, error);
            throw error;
        }
    }

    async sendBulkPushNotifications({ tokens, title, body, data = {} }) {
        if (!this.firebaseApp || !tokens || tokens.length === 0) {
            throw new Error('Push notification service not configured or no tokens provided');
        }

        try {
            const message = {
                notification: {
                    title,
                    body
                },
                data,
                tokens
            };

            const result = await admin.messaging().sendMulticast(message);
            logger.info(`Bulk push notifications sent`, { 
                successCount: result.successCount,
                failureCount: result.failureCount 
            });
            return result;
        } catch (error) {
            logger.error('Failed to send bulk push notifications:', error);
            throw error;
        }
    }
}

module.exports = new NotificationService();