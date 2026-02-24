import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    }
});

interface BookingReceiptData {
    customerName: string;
    turfName: string;
    bookingDate: string;
    timeSlot: string;
    amountPaid: number;
    bookingId: string;
}

export const sendBookingReceipt = async (toEmail: string, data: BookingReceiptData) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP credentials missing. Email receipt not sent.");
        return;
    }

    const mailOptions = {
        from: `"Dhaval Mart Turf" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `Booking Confirmed! - ${data.turfName}`,
        html: `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #111111; padding: 40px 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #1a1b1a; border-radius: 16px; overflow: hidden; border: 1px solid #333;">
                    <div style="background-color: #bde33c; padding: 25px; text-align: center;">
                        <h1 style="margin: 0; color: #111111; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Booking Confirmed</h1>
                        <p style="margin: 8px 0 0 0; font-size: 16px; color: #111111; font-weight: 600;">Game On! Your turf is secured.</p>
                    </div>
                    <div style="padding: 30px;">
                        <h2 style="color: #ffffff; border-bottom: 1px solid #333; padding-bottom: 15px; margin-top: 0;">Hi ${data.customerName},</h2>
                        <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6;">Thank you for choosing <strong>${data.turfName}</strong>. We've received your payment of <strong style="color: #bde33c;">₹${data.amountPaid}</strong>.</p>
                        
                        <div style="background-color: #111111; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #333;">
                            <h3 style="margin-top: 0; color: #bde33c; text-transform: uppercase; letter-spacing: 1px; font-size: 14px;">Reservation Details</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px 0; color: #a0a0a0; font-weight: bold;">Booking ID</td>
                                    <td style="padding: 10px 0; color: #ffffff; text-align: right; font-family: monospace;">#${data.bookingId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #a0a0a0; font-weight: bold; border-top: 1px solid #222;">Date</td>
                                    <td style="padding: 10px 0; color: #ffffff; text-align: right; border-top: 1px solid #222;">${data.bookingDate}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #a0a0a0; font-weight: bold; border-top: 1px solid #222;">Time Slot</td>
                                    <td style="padding: 10px 0; color: #ffffff; text-align: right; font-weight: bold; border-top: 1px solid #222;">${data.timeSlot}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #a0a0a0; font-weight: bold; border-top: 1px solid #222;">Location</td>
                                    <td style="padding: 10px 0; color: #ffffff; text-align: right; border-top: 1px solid #222;">${data.turfName}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <p style="color: #888888; font-size: 14px; line-height: 1.5;">Please arrive 10 minutes early. Bring your 'A' game and don't forget your non-marking shoes or turf studs.</p>
                        
                        <p style="color: #ffffff; font-size: 16px; margin-top: 30px; font-weight: bold;">See you on the pitch!<br><span style="color: #bde33c;">The Dhaval Plaza Team</span></p>
                    </div>
                    <div style="background-color: #111111; color: #666666; text-align: center; padding: 15px; font-size: 12px; border-top: 1px solid #333;">
                        © ${new Date().getFullYear()} Dhaval Plaza Arena. All rights reserved.
                    </div>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Receipt sent to ${toEmail}: ${info.messageId}`);
    } catch (error) {
        console.error("Error sending receipt email:", error);
    }
};

export const sendAuthOtpEmail = async (toEmail: string, name: string, otpCode: string, purpose: 'Verification' | 'Password Reset' = 'Verification') => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP credentials missing. OTP email not sent.");
        return;
    }

    const mailOptions = {
        from: `"Dhaval Mart Turf Security" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `Your ${purpose} Code - Dhaval Mart Turf`,
        html: `
            <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="background-color: #1a1b1a; color: #bde33c; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-weight: 900; letter-spacing: 1px;">Security Alert</h1>
                    </div>
                    <div style="padding: 30px 20px; text-align: center;">
                        <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
                        <p style="color: #666; font-size: 16px;">Here is your secure 6-digit ${purpose.toLowerCase()} code:</p>
                        
                        <div style="background-color: #f9f9f9; border: 2px dashed #ccc; display: inline-block; padding: 15px 30px; margin: 20px 0; border-radius: 8px;">
                            <h1 style="margin: 0; font-size: 36px; letter-spacing: 5px; color: #333;">${otpCode}</h1>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">This code is valid for 10 minutes. Please do not share this code with anyone.</p>
                        <p style="color: #666; font-size: 14px; margin-top: 30px;"><strong>The Dhaval Mart Turf Team</strong></p>
                    </div>
                    <div style="background-color: #eeeeee; color: #888888; text-align: center; padding: 10px; font-size: 12px;">
                        © ${new Date().getFullYear()} Dhaval Mart Turf. All rights reserved.
                    </div>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${toEmail}: ${info.messageId}`);
    } catch (error) {
        console.error("Error sending OTP email:", error);
        throw new Error("Failed to send Email OTP");
    }
};

export const sendRefundReceipt = async (toEmail: string, data: BookingReceiptData) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP credentials missing. Refund receipt not sent.");
        return;
    }

    const mailOptions = {
        from: `"Dhaval Mart Turf" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `Refund Processed - ${data.turfName}`,
        html: `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #111111; padding: 40px 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #1a1b1a; border-radius: 16px; overflow: hidden; border: 1px solid #333;">
                    <div style="background-color: #ef4444; padding: 25px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Refund Processed</h1>
                        <p style="margin: 8px 0 0 0; font-size: 16px; color: #ffffff; font-weight: 600;">Your booking has been cancelled and refunded.</p>
                    </div>
                    <div style="padding: 30px;">
                        <h2 style="color: #ffffff; border-bottom: 1px solid #333; padding-bottom: 15px; margin-top: 0;">Hi ${data.customerName},</h2>
                        <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6;">Your booking at <strong>${data.turfName}</strong> has been cancelled by the administrative team. A refund of <strong style="color: #ef4444;">₹${data.amountPaid}</strong> has been initiated and will reflect in your original payment method shortly.</p>
                        
                        <div style="background-color: #111111; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #333;">
                            <h3 style="margin-top: 0; color: #ef4444; text-transform: uppercase; letter-spacing: 1px; font-size: 14px;">Cancelled Reservation</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px 0; color: #a0a0a0; font-weight: bold;">Booking ID</td>
                                    <td style="padding: 10px 0; color: #ffffff; text-align: right; font-family: monospace;">#${data.bookingId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #a0a0a0; font-weight: bold; border-top: 1px solid #222;">Date</td>
                                    <td style="padding: 10px 0; color: #ffffff; text-align: right; border-top: 1px solid #222;">${data.bookingDate}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #a0a0a0; font-weight: bold; border-top: 1px solid #222;">Time Slot</td>
                                    <td style="padding: 10px 0; color: #ffffff; text-align: right; font-weight: bold; border-top: 1px solid #222;">${data.timeSlot}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <p style="color: #888; font-size: 14px; text-align: center; margin-top: 30px;">
                            If you have any questions regarding this cancellation, please contact our support desk.
                        </p>
                    </div>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending refund email:", error);
    }
};
