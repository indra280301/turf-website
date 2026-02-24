import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

const client = twilio(accountSid, authToken);

async function testVerify() {
    try {
        console.log("Sending SMS...");
        await client.verify.v2.services(verifySid).verifications.create({
            to: '+917620209732',
            channel: 'sms'
        });
        console.log("SMS Verification Initiated.");

        console.log("Sending WhatsApp...");
        await client.verify.v2.services(verifySid).verifications.create({
            to: '+917620209732',
            channel: 'whatsapp'
        });
        console.log("WhatsApp Verification Initiated.");
    } catch (err: any) {
        console.error("Error:", err.message);
    }
}
testVerify();
