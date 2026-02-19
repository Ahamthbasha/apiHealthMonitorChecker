import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { type AxiosError } from "axios";
import { useState } from "react";
import InputField from "../../../component/common/Inputfield";
import PasswordField from "../../../component/common/Passwordfield";
import { registerUser } from "../../../api/authAction/userAuth";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

interface ErrorResponse {
  success: boolean;
  message?: string;
  errors?: Array<{ msg: string; path: string }>;
}

export default function Register() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsSubmitting(true);
    try {
      const { name, email, password } = data;
      const res = await registerUser({ name, email, password });

      if (res.success) {
        toast.success(res.message || "OTP sent successfully! Check your email.");
        navigate("/verifyOtp", {
          state: {
            email: res.data?.email || email,
            expiresIn: res.data?.expiresIn || 60,
          },
        });
      }
    } catch (error: unknown) {
      const err = error as AxiosError<ErrorResponse>;
      if (err.response?.data) {
        const responseData = err.response.data;
        if (responseData.errors && Array.isArray(responseData.errors)) {
          responseData.errors.forEach((v) => toast.error(v.msg));
        } else if (responseData.message) {
          toast.error(responseData.message);
        } else {
          toast.error("Registration failed. Please try again.");
        }
      } else {
        toast.error("Network error. Please check your connection and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-white animate-pulse" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">API Health</span>
          </div>
          <p className="text-sm text-gray-500">Start monitoring your APIs</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-700/50 rounded-xl p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Create Account</h2>
            <p className="text-sm text-gray-500 mt-1">Monitor your endpoints 24/7</p>
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-3.5 mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Password Requirements
            </h3>
            <ul className="space-y-1">
              {[
                "At least 6 characters long",
                "One uppercase letter",
                "One lowercase letter",
                "One number",
              ].map((req) => (
                <li key={req} className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-1 h-1 rounded-full bg-green-500 flex-shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputField
              label="Full Name"
              id="name"
              type="text"
              placeholder="John Doe"
              {...register("name")}
              error={errors.name?.message}
            />
            <InputField
              label="Email Address"
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              error={errors.email?.message}
            />
            <PasswordField
              label="Password"
              id="password"
              placeholder="••••••••"
              {...register("password")}
              error={errors.password?.message}
            />
            <PasswordField
              label="Confirm Password"
              id="confirmPassword"
              placeholder="••••••••"
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-green-400 hover:text-green-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}