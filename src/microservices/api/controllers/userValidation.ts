import * as yup from 'yup';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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
    .email('Invalid email format')
    .transform((value: string) => value.toLowerCase()),
  image_path: yup.string()
    .optional()
    .matches(
      /^(\.\.\/)*assets\/[a-zA-Z0-9_\-\.\/]+\.(png|jpg|jpeg|gif)$/,
      'Image path must be a valid local path like assets/default.png'
    )
});

export const loginSchema = yup.object({
    email: yup.string()
    .required('Email is required')
    .email('Invalid email format')
    .transform((value: string) => value.toLowerCase()),
});

export type RegisterInput = yup.InferType<typeof registerSchema>;
export type LoginInput = yup.InferType<typeof loginSchema>;