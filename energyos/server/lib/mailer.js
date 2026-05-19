const nodemailer = require('nodemailer');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const hasSmtp = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD;

const transporter = hasSmtp ? nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
}) : null;

/**
 * Send an access code email to a clinic
 * @param {string} to - Recipient email
 * @param {string} clinicName - Clinic name
 * @param {string} code - Access code
 */
async function sendAccessCodeEmail(to, clinicName, code) {
  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #0A0D14; color: #F1F5F9; border-radius: 16px;">
      <h1 style="color: #00D4FF; margin-bottom: 8px;">EnergyOS</h1>
      <p>Bonjour <strong>${clinicName}</strong>,</p>
      <p>Votre demande d'accès a été approuvée. Voici votre code d'accès :</p>
      <div style="background: #111827; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-family: 'Courier New', monospace; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #00D4FF;">${code}</span>
      </div>
      <p>Rendez-vous sur <a href="https://energyos.netlify.app/onboarding" style="color: #00D4FF;">energyos.netlify.app</a> et entrez ce code pour accéder à votre tableau de bord.</p>
      <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;" />
      <p style="font-size: 12px; color: #64748B;">Ce code est personnel et confidentiel. Ne le partagez pas.</p>
    </div>
  `;

  console.log(`[MAIL MOCK] Mail destination: ${to} | Clinic: ${clinicName} | Code: ${code}`);

  if (transporter) {
    await transporter.sendMail({
      from: `"EnergyOS" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Votre code d'accès EnergyOS — ${clinicName}`,
      html,
    });
  } else {
    console.log('[MAIL MOCK] Gmail SMTP is commented out / not configured. Email logged instead.');
  }
}

module.exports = { sendAccessCodeEmail };
