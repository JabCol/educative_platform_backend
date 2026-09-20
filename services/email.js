import nodemailer from 'nodemailer'
import { SEND_EMAIL_CONFIG } from '../config.js'

// Creates a Nodemailer transporter configured to connect to the email provider's SMTP server.
// The transporter will be used to send emails from the application.
const transporter = nodemailer.createTransport({
    host: SEND_EMAIL_CONFIG.host,
    port: Number(SEND_EMAIL_CONFIG.port),
    secure: true,
    auth: {
        user: SEND_EMAIL_CONFIG.user,
        pass: SEND_EMAIL_CONFIG.password
    }
})

/**
 * Sends a transactional email containing the password reset link.
 *
 * @async
 * @function sendResetPasswordEmail
 * @param {Object} params - Parameters required to send the email.
 * @param {string} params.toEmail - Recipient's email address.
 * @param {string} params.resetUrl - Unique URL containing the password reset token.
 * @returns {Promise<import('nodemailer').SentMessageInfo>} Promise resolving to the SMTP server response.
 * @throws {Error} Throws an error if the email fails to send or SMTP credentials are invalid.
 */
export const sendResetPasswordEmail = async ({ toEmail, resetUrl }) => {
    const mailOptions = {
        from: '"Plataforma Educativa Carita de Ángel F.J." <no-reply@tu-dominio.com>',
        to: toEmail,
        subject: 'Restablecer contraseña',
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Recuperación de Contraseña</h2>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
        <a href="${resetUrl}" style="background-color: #c25477; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Restablecer mi contraseña</a>
        <p>Este enlace expirará en 15 minutos.</p>
        <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
      </div>
    `
    }

    return await transporter.sendMail(mailOptions)
}
