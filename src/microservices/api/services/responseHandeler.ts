// responseHandler.ts
import { FastifyReply } from "fastify";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}

export class ResponseHandler {
  static sendSuccess<T>(
    reply: FastifyReply, 
    data?: T, 
    message: string = 'Operation successful'
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data
    };
    reply.send(response);
  }

  static sendError(
    reply: FastifyReply, 
    statusCode: number, 
    error: string,
    details?: any
  ): void {
    const response: ApiResponse = {
      success: false,
      error,
      details
    };
    reply.status(statusCode).send(response);
  }

  static sendValidationError(
    reply: FastifyReply, 
    error: any
  ): void {
    this.sendError(
      reply, 
      400, 
      'Validation failed', 
      error.errors
    );
  }

  static sendConflict(
    reply: FastifyReply, 
    message: string | { error : string }
  ): void {
    const errorMessage = typeof message === 'string' ? message : message.error;
    this.sendError(reply, 409, errorMessage);
  }

  static sendNotFound(
    reply: FastifyReply, 
    resource: string = 'Resource'
  ): void {
    this.sendError(reply, 404, `${resource} not found`);
  }

  static sendUnauthorized(
    reply: FastifyReply, 
    message: string = 'Unauthorized'
  ): void {
    this.sendError(reply, 401, message);
  }

  static sendInternalError(
    reply: FastifyReply, 
    error: any
  ): void {
    this.sendError(reply, 500, error.message);
  }
}