// component/common/Inputfield.tsx
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <label
          htmlFor={id}
          className="block text-xs font-medium text-gray-400 uppercase tracking-wider"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={`
            w-full px-3 py-2 rounded-lg text-sm
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
        {error && (
          <p className="text-xs text-red-400 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";

export default InputField;