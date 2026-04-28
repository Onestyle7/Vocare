'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ButtonForm } from '@/components/ui/button-form';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { register } from '../actions';

const signUpPasswordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one digit')
  .regex(
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
    'Password must contain at least one special character'
  );

export const signUpSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: signUpPasswordSchema,
    confirmPassword: z.string(),
    fullName: z.string().min(2).max(50),
    marketingConsent: z.boolean().default(false),
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

export type SignUpFormType = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const [isRegisterPending, startTransition] = useTransition();
  const router = useRouter();

  const resolver = zodResolver(signUpSchema);
  const form = useForm<SignUpFormType>({
    resolver,
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSignUp = async (formValues: SignUpFormType) => {
    startTransition(async () => {
      const result = await register(formValues);
      if (result.success) {
        router.push('/sign-in');
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSignUp)} className="auth-form font-poppins">
        <h1 className="form-title">Zarejestruj się</h1>

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imię i nazwisko</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} className="input-profile" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="johndoe@gmail.com" {...field} className="input-profile" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hasło</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Hasło" {...field} className="input-profile" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Potwierdź hasło</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Potwierdź hasło"
                  {...field}
                  className="input-profile"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ButtonForm type="submit" disabled={isRegisterPending} className="group form-button">
          Dołącz do Vocare
          <span className="arrow-animation">
            <ArrowRight />
          </span>
          {isRegisterPending && (
            <Image
              src="/svg/loader.svg"
              alt="loader"
              width={24}
              height={24}
              className="ml-2 animate-spin"
            />
          )}
        </ButtonForm>

        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center">
            <p>Masz już konto?</p>
            <Link
              href="/sign-in"
              className="relative ml-2 font-semibold text-[#915EFF] transition duration-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#915EFF] after:transition-all after:duration-300 after:content-[''] hover:after:w-full"
            >
              Zaloguj się
            </Link>
          </div>

          <FormField
            control={form.control}
            name="marketingConsent"
            render={({ field }) => (
              <FormItem className="w-full space-y-2 rounded-lg border border-transparent transition-colors">
                <div className="flex items-start gap-3">
                  <FormControl>
                    <Checkbox
                      id="marketingConsent"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <div className="space-y-2 text-sm leading-snug">
                    <FormLabel htmlFor="marketingConsent" className="text-foreground font-medium">
                      Wyrażam zgodę na otrzymywanie od firmy Vocare okazjonalnych aktualizacji
                      produktów i wiadomości e-mail o charakterze marketingowym.
                    </FormLabel>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
}
