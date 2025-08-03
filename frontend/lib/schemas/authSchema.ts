import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one digit');

export const authFormSchema = (formType: 'sign-in' | 'sign-up') =>
  z
    .object({
      email: z.string().email('Invalid email address'),
      password: passwordSchema,
      fullName:
        formType === 'sign-up'
          ? z.string().min(2).max(50)
          : z.string().optional(),
      confirmPassword:
        formType === 'sign-up'
          ? z.string().optional()
          : z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (formType === 'sign-up' && data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Passwords do not match',
          path: ['confirmPassword'],
        });
      }
    });

export type AuthFormType = z.infer<ReturnType<typeof authFormSchema>>;
