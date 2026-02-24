import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const smsFrom = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';

async function testSMS() {
    try {
        console.log("Sending from:", smsFrom);
        const result = await client.messages.create({
            body: `Test VIP Alert! ${Math.floor(Math.random() * 900000)}`,
            from: smsFrom,
            to: '+917620209732',
        });
        console.log("Success! SID:", result.sid);
    } catch (error: any) {
        console.error("Failed:", error.message);
    }
}
testSMS();
