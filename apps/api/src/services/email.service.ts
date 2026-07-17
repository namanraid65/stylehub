import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export const sendOrderConfirmationEmail = async (order: any) => {
  try {
    const orderNumber = order.orderNumber;
    let recipientEmail = order.guestInfo?.email;
    let recipientName = order.guestInfo?.name;

    if (!recipientEmail && order.customer) {
      try {
        const User = mongoose.model('User');
        const userDoc = await User.findById(order.customer);
        if (userDoc) {
          recipientEmail = userDoc.email;
          recipientName = userDoc.name;
        }
      } catch (err) {
        logger.error('[EmailService] Failed to fetch customer user details:', err);
      }
    }

    recipientEmail = recipientEmail || 'customer@example.com';
    recipientName = recipientName || 'Customer';

    logger.info(`[EmailService] Preparing order confirmation email for: ${recipientEmail}`);

    const itemsRows = order.fulfillments
      .flatMap((f: any) => f.items)
      .map((item: any) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e8e6e1; font-family: sans-serif; font-size: 14px;">
            <strong>${item.name}</strong><br/>
            <span style="font-size: 11px; color: #777;">Size: ${item.size} | Color: ${item.color}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e8e6e1; text-align: center; font-family: sans-serif; font-size: 14px; color: #555;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e8e6e1; text-align: right; font-family: sans-serif; font-size: 14px; font-weight: 600; color: #111;">
            ₹${item.price.toLocaleString('en-IN')}
          </td>
        </tr>
      `).join('');

    const formattedTotal = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation - StyleHub</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f5f0; font-family: Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f7f5f0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #1a1a1a; padding: 30px; color: #ffffff;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Style<span style="color: #C84B31;">Hub</span></h1>
              <p style="margin: 5px 0 0 0; font-size: 11px; opacity: 0.8; text-transform: uppercase; letter-spacing: 2px;">Order Confirmation</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #111;">Thank you for your order, ${recipientName}!</h2>
              <p style="margin: 0 0 30px 0; font-size: 14px; color: #555; line-height: 1.5;">
                We've received your order and are getting it ready. You can track its status directly in your account dashboard.
              </p>

              <!-- Order Summary Meta -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fcfbfa; border: 1px solid #e8e6e1; border-radius: 8px; padding: 15px; margin-bottom: 30px;">
                <tr>
                  <td style="font-size: 13px; color: #666; padding: 3px 0;"><strong>Order Number:</strong></td>
                  <td align="right" style="font-size: 13px; color: #111; padding: 3px 0;"><strong>${orderNumber}</strong></td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #666; padding: 3px 0;"><strong>Payment Method:</strong></td>
                  <td align="right" style="font-size: 13px; color: #111; padding: 3px 0; text-transform: uppercase;">${order.paymentMethod}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #666; padding: 3px 0;"><strong>Delivery Address:</strong></td>
                  <td align="right" style="font-size: 13px; color: #111; padding: 3px 0;">${order.address?.street || ''}, ${order.address?.city || ''}</td>
                </tr>
              </table>

              <!-- Items Table -->
              <h3 style="margin: 0 0 10px 0; font-size: 16px; border-bottom: 2px solid #1a1a1a; padding-bottom: 5px; color: #111;">Items Ordered</h3>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                <thead>
                  <tr style="background-color: #fcfbfa;">
                    <th align="left" style="padding: 10px; font-size: 12px; color: #666; text-transform: uppercase;">Product</th>
                    <th align="center" style="padding: 10px; font-size: 12px; color: #666; text-transform: uppercase; width: 60px;">Qty</th>
                    <th align="right" style="padding: 10px; font-size: 12px; color: #666; text-transform: uppercase; width: 100px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>

              <!-- Price breakdown -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #e8e6e1; padding-top: 15px;">
                <tr>
                  <td style="font-size: 13px; color: #666; padding: 4px 0;">Subtotal</td>
                  <td align="right" style="font-size: 13px; color: #111; padding: 4px 0;">${formattedTotal(order.totals?.subtotal)}</td>
                </tr>
                ${order.totals?.discount > 0 ? `
                <tr>
                  <td style="font-size: 13px; color: #C84B31; padding: 4px 0;">Discount</td>
                  <td align="right" style="font-size: 13px; color: #C84B31; padding: 4px 0;">-${formattedTotal(order.totals?.discount)}</td>
                </tr>` : ''}
                <tr>
                  <td style="font-size: 13px; color: #666; padding: 4px 0;">GST (18%)</td>
                  <td align="right" style="font-size: 13px; color: #111; padding: 4px 0;">${formattedTotal(order.totals?.tax)}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #666; padding: 4px 0;">Delivery</td>
                  <td align="right" style="font-size: 13px; color: #111; padding: 4px 0;">${order.totals?.delivery === 0 ? 'FREE' : formattedTotal(order.totals?.delivery)}</td>
                </tr>
                <tr>
                  <td style="font-size: 16px; font-weight: bold; color: #111; padding: 15px 0 0 0;">Total Amount</td>
                  <td align="right" style="font-size: 16px; font-weight: bold; color: #C84B31; padding: 15px 0 0 0;">${formattedTotal(order.totals?.total)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f4f2ee; padding: 25px; border-top: 1px solid #e8e6e1; font-size: 11px; color: #777; line-height: 1.5;">
              <p style="margin: 0;">This is an automated order confirmation email. Please do not reply directly.</p>
              <p style="margin: 5px 0 0 0;">StyleHub Marketplace Inc. · Mumbai, India</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // 1. Always save a local copy for preview / validation
    const dir = path.join(process.cwd(), 'temp', 'emails');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filepath = path.join(dir, `order-${orderNumber}.html`);
    fs.writeFileSync(filepath, htmlContent, 'utf-8');
    logger.info(`[EmailService] Local HTML invoice copy saved at: file:///${filepath.replace(/\\/g, '/')}`);

    // 2. Try to dispatch a real email via Resend API
    const resendApiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM || 'StyleHub <onboarding@resend.dev>';
    
    if (resendApiKey && resendApiKey !== 're_' && resendApiKey.trim() !== '') {
      logger.info(`[EmailService] Sending real email via Resend to ${recipientEmail}...`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [recipientEmail],
          subject: `Order Confirmation #${orderNumber} - StyleHub`,
          html: htmlContent
        })
      });
      const resJson: any = await response.json();
      if (response.ok) {
        logger.info(`[EmailService] Real email successfully sent via Resend. ID: ${resJson.id}`);
        return;
      } else {
        logger.warn(`[EmailService] Resend API failed: ${JSON.stringify(resJson)}. Falling back to SMTP...`);
      }
    }

    // 3. Fallback to Nodemailer SMTP transport if configured in .env
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      logger.info(`[EmailService] Sending real email via SMTP (${smtpHost}) to ${recipientEmail}...`);
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      await transporter.sendMail({
        from: emailFrom,
        to: recipientEmail,
        subject: `Order Confirmation #${orderNumber} - StyleHub`,
        html: htmlContent
      });

      logger.info(`[EmailService] Real email successfully sent via SMTP.`);
      return;
    }

    // 4. Auto-fallback to Ethereal Mail (dynamic test account)
    logger.info(`[EmailService] SMTP credentials not set. Creating automatic Ethereal Mail test account...`);
    const testAccount = await nodemailer.createTestAccount();
    const testTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });

    const info = await testTransporter.sendMail({
      from: `"StyleHub Confirmation" <${testAccount.user}>`,
      to: recipientEmail,
      subject: `Order Confirmation #${orderNumber} - StyleHub`,
      html: htmlContent
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    logger.info(`[EmailService] Email successfully sent to Ethereal Mail!`);
    logger.info(`[EmailService] 📢 Click to view real sent email in Ethereal client: ${previewUrl}`);

  } catch (err) {
    logger.error(`[EmailService] Failed to dispatch order confirmation email:`, err);
  }
};
