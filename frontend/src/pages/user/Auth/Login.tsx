import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { type AxiosError } from "axios";
import { useDispatch } from "react-redux";
import InputField from "../../../component/common/Inputfield";
import PasswordField from "../../../component/common/Passwordfield";
import { login } from "../../../api/authAction/userAuth";
import { setUser } from "../../../redux/slices/userSlice";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

interface ValidationError {
  msg: string;
  path: string;
}

interface ErrorResponse {
  success: boolean;
  message?: string;
  errors?: ValidationError[];
}

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await login(data);

      if (res.success) {
        const { user } = res.data;
        dispatch(setUser({ _id: user.id, name: user.name, email: user.email, role: user.role }));
        toast.success("Login successful! Monitoring your APIs...");
        navigate("/");
      }
    } catch (error: unknown) {
      const err = error as AxiosError<ErrorResponse>;
      if (err.response?.data) {
        const responseData = err.response.data;
        if (responseData.errors && Array.isArray(responseData.errors)) {
          responseData.errors.forEach((v, i) =>
            toast.error(v.msg, { toastId: `error-${v.path}-${i}` })
          );
        } else if (responseData.message) {
          toast.error(responseData.message);
        } else {
          toast.error("Login failed. Please try again.");
        }
      } else {
        toast.error("Network error. Please check your connection and try again.");
      }
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
          <p className="text-sm text-gray-500">Monitor your endpoints in real-time</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-700/50 rounded-xl p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Welcome Back</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to monitor your APIs</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-green-400 hover:text-green-300 font-medium transition-colors">
              Sign up
            </Link>
          </p>

          {/* Status bar */}
          <div className="mt-6 pt-5 border-t border-gray-700/50">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                API Status: Active
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Secure Connection
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}