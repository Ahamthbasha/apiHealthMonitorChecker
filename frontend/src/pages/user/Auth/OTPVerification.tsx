import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { type AxiosError } from "axios";
import InputField from "../../../component/common/Inputfield";
import { verifyOTP, resendOTP } from "../../../api/authAction/userAuth";

const otpSchema = z.object({
  otp: z
    .string()
    .min(6, "OTP must be 6 digits")
    .max(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

type OTPForm = z.infer<typeof otpSchema>;

interface LocationState {
  email: string;
  expiresIn?: number;
}

interface ErrorResponse {
  success: boolean;
  message?: string;
  data?: {
    expiresIn?: number;
  };
}

interface ResendOTPResponse {
  success: boolean;
  message?: string;
  data?: {
    expiresIn?: number;
  };
}

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    resetField,
  } = useForm<OTPForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  // Redirect if no email in state
  useEffect(() => {
    if (!state?.email) {
      toast.error("No verification session found. Please register again.");
      navigate("/register");
    }
  }, [state, navigate]);

  // Set initial timer from backend or default
  useEffect(() => {
    if (state?.expiresIn) {
      setTimer(state.expiresIn);
    }
  }, [state]);

  // Countdown timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timer]);

  const onSubmit = async (data: OTPForm) => {
    if (!state?.email) return;
    
    setIsVerifying(true);
    try {
      const res = await verifyOTP({ 
        email: state.email, 
        otp: data.otp 
      });

      if (res.success) {
        toast.success(res.message || "Email verified successfully! You can now log in.");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error: unknown) {
      const err = error as AxiosError<ErrorResponse>;
      toast.error(err.response?.data?.message || "OTP verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!state?.email) return;
    
    setIsResending(true);
    try {
      const res = await resendOTP({ email: state.email }) as ResendOTPResponse;
      
      if (res.success) {
        toast.success(res.message || "New OTP sent successfully!");
        
        resetField("otp", { 
          defaultValue: "",
          keepError: false,
          keepTouched: false,
          keepDirty: false
        });
        
        setValue("otp", "", { 
          shouldValidate: false,
          shouldDirty: false,
          shouldTouch: false 
        });
        
        const expiresIn = res.data?.expiresIn || 60;
        setTimer(expiresIn);
        setCanResend(false);
      }
    } catch (error: unknown) {
      const err = error as AxiosError<ErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleGoBack = () => {
    navigate("/register");
  };

  const maskEmail = (email: string) => {
    if (!email) return "";
    const [localPart, domain] = email.split("@");
    if (localPart.length <= 3) {
      return `${localPart}***@${domain}`;
    }
    return `${localPart.substring(0, 3)}***${localPart.substring(localPart.length - 1)}@${domain}`;
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setValue("otp", value, { shouldValidate: true });
    
    if (value.length === 6) {
      handleSubmit(onSubmit)();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full mb-4">
            <span className="text-3xl">📧</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h1>
          <p className="text-sm text-gray-600 mb-2">
            We've sent a verification code to:
          </p>
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-900">
              {state?.email ? maskEmail(state.email) : ""}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <InputField
            label="Enter Verification Code"
            id="otp"
            type="text"
            placeholder="123456"
            {...register("otp")}
            onChange={handleOtpChange}
            error={errors.otp?.message}
            maxLength={6}
            autoComplete="off"
            autoFocus={true}
            className="text-center text-2xl tracking-widest font-mono"
          />

          {/* Timer */}
          <div className="text-center">
            {!canResend ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                <span className="text-sm text-gray-600">
                  Code expires in <span className="font-bold text-blue-600">{timer}s</span>
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 rounded-lg">
                <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span className="text-sm text-yellow-700">Code expired. Request a new one.</span>
              </div>
            )}
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={isVerifying}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isVerifying ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Verifying...
              </div>
            ) : (
              "Verify & Continue"
            )}
          </button>

          {/* Resend Section */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={!canResend || isResending}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-cyan-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isResending ? (
                <>
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Resend OTP
                </>
              )}
            </button>
          </div>

          {/* Back Button */}
          <button
            type="button"
            onClick={handleGoBack}
            className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Registration
          </button>
        </form>

        {/* Security Note */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            For security reasons, this code will expire in {timer} seconds
          </p>
        </div>
      </div>
    </div>
  );
}