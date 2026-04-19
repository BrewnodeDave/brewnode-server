/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

/**
 * Email Notification Service
 * @module email-service
 * @desc Sends email alerts on brewnode errors and critical events via nodemailer.
 *       Configure via environment variables (see .env).
 *
 * Required env vars:
 *   EMAIL_HOST      - SMTP host        (e.g. mail.example.com)
 *   EMAIL_PORT      - SMTP port        (e.g. 465 for SSL, 587 for STARTTLS)
 *   EMAIL_SECURE    - "true" for SSL   (omit or "false" for STARTTLS)
 *   EMAIL_USER      - SMTP login
 *   EMAIL_PASSWORD  - SMTP password
 *   EMAIL_FROM      - From address     (e.g. brewnode@example.com)
 *   EMAIL_TO        - Recipient(s)     (comma-separated)
 */

const nodemailer = require('nodemailer');

const {
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_SECURE,
    EMAIL_USER,
    EMAIL_PASSWORD,
    EMAIL_FROM,
    EMAIL_TO,
} = process.env;

const configured = !!(EMAIL_HOST && EMAIL_USER && EMAIL_PASSWORD && EMAIL_TO);

let transporter = null;

if (configured) {
    transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: parseInt(EMAIL_PORT || '587', 10),
        secure: EMAIL_SECURE === 'true',
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASSWORD,
        },
    });
}

// Throttle: don't send more than one email per subject per THROTTLE_MS window.
const THROTTLE_MS = 60 * 1000; // 1 minute
const lastSent = new Map();

/**
 * Send an alert email. Silently no-ops if email is not configured.
 * Throttled to one email per unique subject per minute.
 * @param {string} subject
 * @param {string} body
 */
async function sendAlert(subject, body) {
    if (!configured || !transporter) return;

    const now = Date.now();
    const last = lastSent.get(subject) || 0;
    if (now - last < THROTTLE_MS) return;
    lastSent.set(subject, now);

    try {
        await transporter.sendMail({
            from: EMAIL_FROM || EMAIL_USER,
            to: EMAIL_TO,
            subject: `[BrewNode] ${subject}`,
            text: `${new Date().toISOString()}\n\n${body}`,
        });
    } catch (err) {
        // Log to console only — avoid recursive brewlog call
        console.error(`[email-service] Failed to send alert "${subject}":`, err.message);
    }
}

module.exports = { sendAlert, configured };
