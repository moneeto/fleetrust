import nodemailer from 'nodemailer';
import { config } from '../config.js';

export interface Mailer {
  send(message: { to: string; subject: string; text: string }): Promise<void>;
}

export function createSmtpMailer(): Mailer {
  const transport = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.password },
  });
  return {
    async send(message) {
      if (!config.smtp.host || !config.smtp.user) throw new Error('SMTP no configurado');
      await transport.sendMail({ from: config.smtp.from, to: message.to, subject: message.subject, text: message.text });
    },
  };
}
