import z from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Niepoprawny adres e-mail'),
});

export type ForgotPasswordFormType = z.infer<typeof forgotPasswordSchema>;

export const signUpPasswordSchema = z
  .string()
  .min(6, 'Hasło musi mieć co najmniej 6 znaków')
  .regex(/[a-z]/, 'Hasło musi zawierać co najmniej jedną małą literę')
  .regex(/[A-Z]/, 'Hasło musi zawierać co najmniej jedną wielką literę')
  .regex(/\d/, 'Hasło musi zawierać co najmniej jedną cyfrę')
  .regex(
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
    'Hasło musi zawierać przynajmniej jeden znak specjalny'
  );

export const resetPasswordSchema = z
  .object({
    newPassword: signUpPasswordSchema,
    confirmPassword: signUpPasswordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Hasła nie są takie same',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormType = z.infer<typeof resetPasswordSchema>;

export const signInSchema = z.object({
  email: z.string().email('Niepoprawny adres email'),
  password: z.string().min(1, 'Hasło jest wymagane'),
});

export type SignInFormType = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    email: z.string().email('Niepoprawny format adresu email'),
    password: signUpPasswordSchema,
    confirmPassword: signUpPasswordSchema,
    fullName: z.string().min(2).max(50),
    acceptMarketingConsent: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Hasła nie są takie same',
        path: ['confirmPassword'],
      });
    }
  });

export type SignUpFormType = z.infer<typeof signUpSchema>;
