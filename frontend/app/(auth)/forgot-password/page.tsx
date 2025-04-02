"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Image from "next/image";

const ForgotPasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: { email: string }) => {
    setIsLoading(true);
    console.log(values);
    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
        <h1 className="form-title">Reset Password</h1>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <div className="shad-form-item">
                <FormLabel className="shad-form-label mb-2">E-mail</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter Your e-mail"
                    className="shad-input"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage className="shad-form-message" />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="form-submit-button"
          disabled={isLoading}
        >
          Send Link
          {isLoading && (
            <Image
              src="/assets/icons/loader.svg"
              alt="loader"
              width={24}
              height={24}
              className="ml-2 animate-spin"
            />
          )}
        </Button>
      </form>
    </Form>
  );
};

export default ForgotPasswordForm;
