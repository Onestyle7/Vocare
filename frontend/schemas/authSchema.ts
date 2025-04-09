import { z } from 'zod';

export const authFormSchema = (formType: 'sign-in' | 'sign-up') =>
  z
    .object({
      email: z.string().email(),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      fullName: formType === 'sign-up' ? z.string().min(2).max(50) : z.string().optional(),
      confirmPassword:
        formType === 'sign-up'
          ? z.string().min(6, 'Password must be at least 6 characters')
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
