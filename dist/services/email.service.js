"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Create a transporter (for development using Ethereal)
const createTransporter = async () => {
    // For production, use your actual email service:
    /*
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    */
    // For development, use Ethereal (fake SMTP service)
    const testAccount = await nodemailer_1.default.createTestAccount();
    return nodemailer_1.default.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
};
exports.emailService = {
    /**
     * Send confirmation email after registration
     */
    sendConfirmationEmail: async (name, email) => {
        try {
            const transporter = await createTransporter();
            const mailOptions = {
                from: '"BoostFlow" <noreply@boostflow.com>',
                to: email,
                subject: 'Welcome to BoostFlow - Registration Confirmation',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f97316;">Welcome to BoostFlow, ${name}!</h2>
            <p>Thank you for registering with BoostFlow. We're excited to have you on board!</p>
            <p>Your account has been successfully created. You can now login and start using our platform.</p>
            <div style="margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/login" 
                 style="background-color: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Login to Your Account
              </a>
            </div>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>The BoostFlow Team</p>
          </div>
        `,
            };
            const info = await transporter.sendMail(mailOptions);
            // For development, log preview URL
            console.log('Registration email sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer_1.default.getTestMessageUrl(info));
            return { success: true, previewUrl: nodemailer_1.default.getTestMessageUrl(info) };
        }
        catch (error) {
            console.error('Error sending email:', error);
            return { success: false, error };
        }
    },
};
