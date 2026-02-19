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
            expiresIn: res.data?.expiresIn || 60 
          } 
        });
      }
    } catch (error: unknown) {
      const err = error as AxiosError<ErrorResponse>;
      
      if (err.response?.data) {
        const responseData = err.response.data;
        
        if (responseData.errors && Array.isArray(responseData.errors)) {
          responseData.errors.forEach((validationErr) => {
            toast.error(validationErr.msg);
          });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">
            API Health
          </h1>
          <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Start monitoring your APIs
          </p>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join to monitor your endpoints 24/7
          </p>
        </div>

        {/* Password Requirements */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-2">
            Password Requirements
          </h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li className="flex items-center gap-2">
              <span className="inline-block w-1 h-1 bg-blue-500 rounded-full"></span>
              At least 6 characters long
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block w-1 h-1 bg-blue-500 rounded-full"></span>
              One uppercase letter
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block w-1 h-1 bg-blue-500 rounded-full"></span>
              One lowercase letter
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block w-1 h-1 bg-blue-500 rounded-full"></span>
              One number
            </li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="space-y-4">
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
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link 
            to="/login" 
            className="font-medium text-blue-600 hover:text-cyan-600 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}