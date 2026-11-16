import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import type { ReactElement } from "react";
import { env } from "../config/env.js";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!env.SMTP_USER || !env.SMTP_PASS) return null;
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
  return transporter;
}

export const INFO_ADMIN_EMAIL = "info@socaltrucktrade.com";

export function staffInboxes() {
  const emails = [env.ADMIN_EMAIL, env.MAIL_REPLY_TO, INFO_ADMIN_EMAIL]
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(emails)];
}

export async function sendStaffEmail(subject: string, template: ReactElement, replyTo?: string) {
  await Promise.all(staffInboxes().map((to) => sendEmail(to, subject, template, replyTo)));
}

export async function sendEmail(to: string, subject: string, template: ReactElement, replyTo?: string) {
  const html = await render(template);
  const mailer = getTransporter();

  if (!mailer) {
    console.info(`[mail] ${subject} -> ${to}`);
    return;
  }

  try {
    await mailer.sendMail({
      from: env.MAIL_FROM,
      to,
      subject,
      html,
      replyTo: replyTo || env.MAIL_REPLY_TO || undefined,
    });
  } catch (error) {
    console.error("[mail] send failed", error);
  }
}
