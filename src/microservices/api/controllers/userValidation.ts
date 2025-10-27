import * as yup from 'yup';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

yup.addMethod(yup.string, 'email', function validateEmail(message) {
  return this.matches(emailRegex, {
    message: message || 'Invalid email format',
    name: 'email',
    excludeEmptyString: true,
  });
});

export const registerSchema = yup.object({
    alias: yup.string()
    .required('Alias is required')
    .min(3, 'Alias must be at least 3 characters')
    .max(20, 'Alias must not exceed 50 characters'),
  email: yup.string()
    .required('Email is required')
    .email('Invalid email format'),
  first_name: yup.string()
    .optional()
    .max(20, 'First name too long'),
  last_name: yup.string()
    .optional()
    .max(20, 'Last name too long'),
  image_path: yup.string()
    .optional()
    .url('Image path must be a valid URL')
});

export const loginSchema = yup.object({
    email: yup.string()
    .required('Email is required')
    .email('Invalid email format')
});

export type RegisterInput = yup.InferType<typeof registerSchema>;
export type LoginInput = yup.InferType<typeof loginSchema>;