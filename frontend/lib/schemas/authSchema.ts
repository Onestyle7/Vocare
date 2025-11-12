import { z } from 'zod';

// Tylko dla sign-up: silniejsze wymagania na hasło
const signUpPasswordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one digit');

// Sign-up schema
export const signUpSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: signUpPasswordSchema,
    confirmPassword: z.string(),
    fullName: z.string().min(2).max(50),
    marketingConsent: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
  });

// Sign-in schema: tylko email i hasło, bez złożonej walidacji hasła
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignUpFormType = z.infer<typeof signUpSchema>;
export type SignInFormType = z.infer<typeof signInSchema>;
