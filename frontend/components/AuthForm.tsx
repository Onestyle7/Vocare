"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authFormSchema, AuthFormType } from "@/schemas/authSchema";
import { registerUser, loginUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

type FormType = "sign-in" | "sign-up";

const AuthForm = ({ type }: { type: FormType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const formSchema = authFormSchema(type);
  const form = useForm<AuthFormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: AuthFormType) {
    setIsLoading(true);
    try {
      if (type === "sign-up") {
        await registerUser({
          email: values.email,
          password: values.password,
        });
        toast.success("Registration successful!", {
          description: "You have successfully created an account. Please sign in.",
        });
        router.push("/sign-in");
      } else {
        const data = await loginUser({
          email: values.email,
          password: values.password,
        });
        localStorage.setItem("token", data.accessToken);
        toast.success("Login successful!", {
          description: "Welcome back!",
        });
        router.push("/");
      }
    } catch (error: any) {
      console.error("Error:", error);

      const errorMessage = error.message?.toLowerCase() || "An error occurred";
      const status = error.response?.status; 

      if (status === 401 || errorMessage.includes("invalid") || errorMessage.includes("unauthorized")) {
        toast.error("Invalid credentials", {
          description: "Please check your email or password and try again.",
        });
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("failed to fetch") ||
        errorMessage.includes("service unavailable")
      ) {
        toast.error("Connection error", {
          description: "Unable to connect to the server. Please try again later.",
        });
      } else {
        toast.error("An error occurred", {
          description: errorMessage || "Something went wrong. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
        <h1 className="form-title">
          {type === "sign-in" ? "Sign In" : "Sign Up"}
        </h1>
        {type === "sign-up" && (
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email" {...field} />
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {type === "sign-up" && (
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Confirm Password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={isLoading}>
          {type === "sign-in" ? "Sign In" : "Sign Up"}
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

        <div className="flex justify-center mt-4">
          <p>
            {type === "sign-in" ? "Don't have an account?" : "Already have an account?"}
          </p>
          <Link href={type === "sign-in" ? "/sign-up" : "/sign-in"} className="ml-2 text-brand">
            {type === "sign-in" ? "Sign Up" : "Sign In"}
          </Link>
          {type === "sign-in" && (
            <Link href="/forgot-password" className="ml-4">
              Forgot Password?
            </Link>
          )}
        </div>
      </form>
    </Form>
  );
};

export default AuthForm;
