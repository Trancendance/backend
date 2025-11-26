import nodemailer from 'nodemailer';

class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MYGMAIL,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });
    }

    async sendMagicLink(email:string, magicLink: string, isRegistration: boolean): Promise<boolean> {
        try {
            const subject = isRegistration? 'register': 'login';

            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">${isRegistration ? '¡Bienvenido!' : 'Hola de nuevo!'}</h2>
                    <p>Haz clic en el siguiente enlace para ${isRegistration ? 'completar tu registro' : 'iniciar sesión'}:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${magicLink}" 
                           style="background-color: #007bff; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            ${isRegistration ? 'Completar Registro' : 'Iniciar Sesión'}
                        </a>
                    </div>
                    <p>O copia y pega este enlace en tu navegador:</p>
                    <p style="word-break: break-all; color: #666;">${magicLink}</p>
                    <p><small>Este enlace expirará en 15 minutos.</small></p>
                </div>
            `;

            const mailOptions = {
                from: process.env.MYGMAIL,
                to: email,
                subject: subject,
                html: htmlContent
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email enviado:', result.messageId);
            return true;

        } catch (error) {
            console.error('❌ Error enviando email:', error);
            return false;
        }
    }

    // Método para verificar la configuración
    async verifyConfiguration(): Promise<boolean> {
        try {
            await this.transporter.verify();
            console.log('✅ Configuración de email verificada');
            return true;
        } catch (error) {
            console.error('❌ Error en configuración de email:', error);
            return false;
        }
    }
}

export const emailService = new EmailService();