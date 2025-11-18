import Fastify, { FastifyRequest, FastifyReply } from 'fastify';

//generate tocken de unverified 
//generate tocken already en table player

// Tipos para los tokens
interface UnverifiedTokenPayload {
  email: string;
  type: 'token_not_verified';
}

interface VerifiedTokenPayload {
  email: string;
  type: 'token_verified';
}

type TokenPayload = UnverifiedTokenPayload | VerifiedTokenPayload;

export const generateUnverifiedToken = (email: string, reply: FastifyReply): Promise<string> => {
  return reply.jwtSign(
    {
      email,
      type: 'token_not_verified'
    },
    {
      expiresIn: '10m'
    }
  );
};

export const generateVerifiedToken = (email: string, reply: FastifyReply): Promise<string> => {
  return reply.jwtSign(
    {
      email,
      type: 'token_verified'
    },
    {
      expiresIn: '72h'
    }
  );
};

// Verificar y decodificar token usando el mismo secreto de Fastify
export const verifyAndDecodeToken = async (token: string, request: FastifyRequest
): Promise<{ success: boolean; payload?: TokenPayload; error?: string }> => {
  // Guardar el header original
  const originalAuth = request.headers.authorization;
  console.log("DINS DE verifyAndDecodeToken", originalAuth);

  try {  
    // Temporalmente establecer nuestro token en el header
    request.headers.authorization = `Bearer ${token}`;
    
    // Verificar con Fastify (automáticamente usa el mismo secret)
    const payload = await request.jwtVerify<TokenPayload>();
    console.log("DINS DE try de verifyAndDecodeToken", payload);

    return { success: true, payload };
  } catch (error: any) {
    console.log("DINS DE catch de verifyAndDecodeToken");
    if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
      return { success: false, error: 'Token expired' };
    }
    if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
      return { success: false, error: 'Invalid token' };
    }
    return { success: false, error: 'Token verification failed' };
  } finally {
    // Siempre restaurar el header original, tanto en éxito como en error
    request.headers.authorization = originalAuth;
  }
};

// Función específica para obtener email (uso común)
export const getEmailFromToken = async (token: string, request: FastifyRequest
): Promise<{ success: boolean; email?: string; error?: string }> => {
  console.log("DINSSSS DE getEmailFromToken", token);
  const result = await verifyAndDecodeToken(token, request);
  
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  return { success: true, email: result.payload!.email };
};

export default { 
  generateUnverifiedToken, 
  generateVerifiedToken, 
  verifyAndDecodeToken, 
  getEmailFromToken 
};