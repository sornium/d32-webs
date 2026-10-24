import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Verified domain per user instruction: noreply.d32.store
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "D32 Store <noreply@noreply.d32.store>";

export function isResendConfigured(): boolean {
  return Boolean(RESEND_API_KEY && RESEND_API_KEY.trim().length > 10);
}

/**
 * Send 6-digit email verification code for signup or guest checkout
 */
export async function sendVerificationCodeEmail(
  toEmail: string,
  code: string,
  purpose: "signup" | "guest_checkout" | "login" | "two_factor_auth"
): Promise<{ success: boolean; error?: string }> {
  if (!isResendConfigured() || !resendClient) {
    console.warn("[Email Service] RESEND_API_KEY is not configured. Verification email could not be dispatched via Resend.");
    return {
      success: false,
      error: "Email delivery system is currently undergoing maintenance. Please contact support.",
    };
  }

  const title =
    purpose === "signup"
      ? "Verify your email for D32 Store"
      : purpose === "guest_checkout"
      ? "Your D32 Store Guest Checkout Code"
      : purpose === "two_factor_auth"
      ? "Your D32 Store Two-Factor Authentication (2FA) Code"
      : "Your D32 Store Login Code";

  const actionText =
    purpose === "signup"
      ? "confirm your account registration"
      : purpose === "guest_checkout"
      ? "complete your guest checkout purchase and access your order"
      : purpose === "two_factor_auth"
      ? "complete Two-Factor Authentication (2FA) verification"
      : "log in to your D32 Store account";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0c10; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #121318; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 20px; overflow: hidden;">
                <tr>
                  <td style="padding: 32px 36px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background-color: rgba(255, 255, 255, 0.03);">
                    <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                      D32<span style="color: rgba(255, 255, 255, 0.6); font-weight: 500;">.store</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 36px;">
                    <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #ffffff;">${title}</h1>
                    <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.7);">
                      Use the 6-digit verification code below to ${actionText}. This code will expire in 10 minutes.
                    </p>
                    
                    <div style="text-align: center; margin: 32px 0;">
                      <div style="display: inline-block; padding: 18px 36px; background-color: #ffffff; color: #000000; font-size: 32px; font-weight: 800; letter-spacing: 8px; border-radius: 12px; font-family: monospace;">
                        ${code}
                      </div>
                    </div>
                    
                    <p style="margin: 0 0 12px; font-size: 13px; line-height: 1.5; color: rgba(255, 255, 255, 0.5);">
                      If you did not request this verification code, please ignore this email. Never share this code with anyone.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px 36px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.08); background-color: rgba(0, 0, 0, 0.3); font-size: 12px; color: rgba(255, 255, 255, 0.4);">
                    &copy; ${new Date().getFullYear()} D32 Store. All rights reserved.<br>
                    Secured by 256-bit encryption.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const res = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: `[D32 Store] ${code} is your verification code`,
      html,
    });

    if (res.error) {
      console.error("[Email Service - Resend Error]:", res.error);
      return { success: false, error: res.error.message || "Failed to deliver email through Resend." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[Email Service - Resend Exception]:", err?.message || err);
    return { success: false, error: err?.message || "Failed to communicate with Resend API." };
  }
}

/**
 * Send customer notification when an admin replies to their support ticket
 */
export async function sendTicketReplyNotification(params: {
  customerEmail: string;
  customerName?: string;
  ticketId: string;
  subject: string;
  agentName?: string;
  portalUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isResendConfigured() || !resendClient || !params.customerEmail) {
    return { success: false, error: "Resend not configured or customer email missing" };
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New reply on your ticket #${params.ticketId}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0c10; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #121318; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 20px; overflow: hidden;">
                <tr>
                  <td style="padding: 32px 36px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background-color: rgba(255, 255, 255, 0.03);">
                    <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                      D32<span style="color: rgba(255, 255, 255, 0.6); font-weight: 500;">.store</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 36px;">
                    <h1 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #ffffff;">Support Update: Ticket #${params.ticketId}</h1>
                    <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.7);">
                      Hello ${params.customerName || "Customer"}, an administrator (${params.agentName || "D32 Support Specialist"}) has replied to your support ticket regarding:
                    </p>
                    <div style="padding: 14px 18px; background-color: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 12px; font-size: 14px; font-weight: 600; color: #ffffff; margin-bottom: 24px;">
                      ${params.subject}
                    </div>
                    
                    <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.7);">
                      To ensure your security and privacy, sensitive product details and responses are securely hosted inside your D32.store support portal.
                    </p>

                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${params.portalUrl}" style="display: inline-block; padding: 14px 32px; background-color: #ffffff; color: #000000; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 9999px;">
                        Open Ticket in Support Portal &rarr;
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px 36px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.08); background-color: rgba(0, 0, 0, 0.3); font-size: 12px; color: rgba(255, 255, 255, 0.4);">
                    &copy; ${new Date().getFullYear()} D32 Store. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const res = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: [params.customerEmail],
      subject: `[D32 Store Support] Reply to ticket #${params.ticketId}: ${params.subject}`,
      html,
    });

    if (res.error) {
      console.error("[Email Service - Ticket Reply Resend Error]:", res.error);
      return { success: false, error: res.error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("[Email Service - Ticket Reply Resend Exception]:", err?.message || err);
    return { success: false, error: err?.message || "Failed to send ticket reply email" };
  }
}

/**
 * Send customer notification when their order has been prepared and marked completed
 */
export async function sendOrderCompletedNotification(params: {
  customerEmail: string;
  orderId: string;
  portalUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isResendConfigured() || !resendClient || !params.customerEmail) {
    return { success: false, error: "Resend not configured or customer email missing" };
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your D32 Store Order #${params.orderId} is Ready</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0c10; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #121318; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 20px; overflow: hidden;">
                <tr>
                  <td style="padding: 32px 36px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background-color: rgba(255, 255, 255, 0.03);">
                    <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                      D32<span style="color: rgba(255, 255, 255, 0.6); font-weight: 500;">.store</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 36px;">
                    <h1 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #ffffff;">Order Ready: #${params.orderId}</h1>
                    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.7);">
                      Great news! An authorized administrator has finalized your order preparation and assigned your digital product keys / credentials.
                    </p>
                    <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.7);">
                      For your security, confidential keys and login details are securely stored in your personal vault. Click the link below to view your order.
                    </p>

                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${params.portalUrl}" style="display: inline-block; padding: 14px 32px; background-color: #ffffff; color: #000000; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 9999px;">
                        Access Purchased Items &rarr;
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px 36px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.08); background-color: rgba(0, 0, 0, 0.3); font-size: 12px; color: rgba(255, 255, 255, 0.4);">
                    &copy; ${new Date().getFullYear()} D32 Store. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const res = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: [params.customerEmail],
      subject: `[D32 Store] Your Order #${params.orderId} is Ready for Access`,
      html,
    });

    if (res.error) {
      console.error("[Email Service - Order Completed Resend Error]:", res.error);
      return { success: false, error: res.error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("[Email Service - Order Completed Resend Exception]:", err?.message || err);
    return { success: false, error: err?.message || "Failed to send order completion email" };
  }
}
