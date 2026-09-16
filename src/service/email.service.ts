import { transporter } from "../config/mailer.js";


export class EmailService {

    async sendVerificationCode(email: string, code: string) {
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: "Verifikacioni kod",
            text: `Vaš kod je: ${code}`,
        });
    }

}