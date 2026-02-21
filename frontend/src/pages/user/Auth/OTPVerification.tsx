import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { type AxiosError } from "axios";
import InputField from "../../../component/common/Inputfield";
import { verifyOTP, resendOTP } from "../../../api/authAction/userAuth";
import type { ErrorResponse, LocationState, ResendOTPResponse } from "./interface/IOTPVerification";

const otpSchema = z.object({
  otp: z
    .string()
    .min(6, "OTP must be 6 digits")
    .max(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

type OTPForm = z.infer<typeof otpSchema>;


function maskEmail(email: string): string {
  if (!email) return "";
  const [localPart, domain] = email.split("@");
  if (localPart.length <= 3) return `${localPart}***@${domain}`;
  return `${localPart.substring(0, 3)}***${localPart.substring(localPart.length - 1)}@${domain}`;
}

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, resetField } = useForm<OTPForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    if (!state?.email) {
      toast.error("No verification session found. Please register again.");
      navigate("/register");
    }
  }, [state, navigate]);

  useEffect(() => {
    if (state?.expiresIn) setTimer(state.expiresIn);
  }, [state]);

  useEffect(() => {
    if (timer <= 0) { setCanResend(true); return; }
    const interval = setInterval(() => setTimer((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const onSubmit = async (data: OTPForm) => {
    if (!state?.email) return;
    setIsVerifying(true);
    try {
      const res = await verifyOTP({ email: state.email, otp: data.otp });
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
        resetField("otp", { defaultValue: "", keepError: false, keepTouched: false, keepDirty: false });
        setValue("otp", "", { shouldValidate: false, shouldDirty: false, shouldTouch: false });
        setTimer(res.data?.expiresIn || 60);
        setCanResend(false);
      }
    } catch (error: unknown) {
      const err = error as AxiosError<ErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setValue("otp", value, { shouldValidate: true });
    if (value.length === 6) handleSubmit(onSubmit)();
  };

  // Timer ring progress (0–100)
  const progress = ((60 - timer) / 60) * 100;
  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

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
          <p className="text-sm text-gray-500">Email verification</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-700/50 rounded-xl p-8">

          {/* Header */}
          <div className="text-center mb-6">
            {/* Timer ring */}
            <div className="inline-flex items-center justify-center mb-4 relative">
              <svg width="56" height="56" className="-rotate-90">
                <circle cx="28" cy="28" r="20" stroke="#1f2937" strokeWidth="3" fill="none" />
                <circle
                  cx="28" cy="28" r="20"
                  stroke={timer > 15 ? "#22c55e" : "#ef4444"}
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
                />
              </svg>
              <span className={`absolute text-sm font-bold font-mono ${timer > 15 ? "text-green-400" : "text-red-400"}`}>
                {timer}s
              </span>
            </div>

            <h2 className="text-lg font-semibold text-white">Verify Your Email</h2>
            <p className="text-sm text-gray-500 mt-1 mb-3">We've sent a verification code to:</p>
            <div className="inline-block bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
              <span className="text-sm font-mono text-gray-300">
                {state?.email ? maskEmail(state.email) : ""}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputField
              label="Verification Code"
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

            {/* Status pill */}
            <div className="flex justify-center">
              {!canResend ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-gray-400">
                    Expires in <span className={`font-bold font-mono ${timer > 15 ? "text-green-400" : "text-red-400"}`}>{timer}s</span>
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-xs text-red-400">Code expired — request a new one</span>
                </div>
              )}
            </div>

            {/* Verify button */}
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Continue"
              )}
            </button>

            {/* Resend */}
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={!canResend || isResending}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-green-400 hover:text-green-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {isResending ? (
                  <>
                    <div className="w-3 h-3 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Resend OTP
                  </>
                )}
              </button>
            </div>

            {/* Back */}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors pt-1"
            >
              ← Back to Registration
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}