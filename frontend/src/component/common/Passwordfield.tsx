
import { forwardRef, useState, } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { PasswordFieldProps } from "./interface/IPasswordfield";



const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={id}
          className="block text-xs font-medium text-gray-400 uppercase tracking-wider"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={showPassword ? "text" : "password"}
            className={`
              w-full px-3 py-2 pr-10 rounded-lg text-sm
              bg-gray-800 text-gray-200 placeholder-gray-600
              border transition-colors focus:outline-none
              ${error
                ? "border-red-500/60 focus:border-red-500"
                : "border-gray-700 hover:border-gray-600 focus:border-green-500"
              }
              ${className ?? ""}
            `}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-400 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

PasswordField.displayName = "PasswordField";

export default PasswordField;