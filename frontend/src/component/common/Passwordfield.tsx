import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="space-y-1">
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={showPassword ? "text" : "password"}
            className={`
              w-full px-3 py-2 border rounded-lg shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-colors pr-10
              ${error 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${className || ''}
            `}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
    );
  },
);

PasswordField.displayName = "PasswordField";

export default PasswordField;