import { FastifyRequest, FastifyReply } from "fastify";
import { emailService } from "../services/emailService.js";

export const testEmailConfig = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        console.log('🔧 Testing email configuration...');
        console.log('Email user:', process.env.MYGMAIL);
        
        const configOk = await emailService.verifyConfiguration();
        
        if (configOk) {
            console.log('✅ Email configuration test passed');
            reply.send({ 
                success: true, 
                message: '✅ Email configuration is OK',
                email: process.env.MYGMAIL 
            });
        } else {
            console.log('❌ Email configuration test failed');
            reply.status(500).send({ 
                success: false, 
                message: '❌ Email configuration failed' 
            });
        }
    } catch (error: any) {
        console.error('💥 Error in testEmailConfig:', error);
        reply.status(500).send({ 
            success: false, 
            message: 'Error: ' + error.message 
        });
    }
};

// Export adicional para probar envío de emails reales
export const testEmailSend = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { email } = request.body as { email: string };
        
        console.log('📧 Testing email send to:', email);
        
        const testLink = "http://localhost:3000/magic-link?token=test_token_123";
        const success = await emailService.sendMagicLink(email, testLink, true);
        
        if (success) {
            console.log('✅ Test email sent successfully');
            reply.send({ 
                success: true, 
                message: '✅ Test email sent successfully',
                to: email
            });
        } else {
            console.log('❌ Failed to send test email');
            reply.status(500).send({ 
                success: false, 
                message: '❌ Failed to send test email' 
            });
        }
    } catch (error: any) {
        console.error('💥 Error in testEmailSend:', error);
        reply.status(500).send({ 
            success: false, 
            message: 'Error: ' + error.message 
        });
    }
};