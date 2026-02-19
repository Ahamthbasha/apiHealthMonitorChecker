import { type InputHTMLAttributes, forwardRef } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={`
            w-full px-3 py-2 border rounded-lg shadow-sm 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-colors
            ${error 
              ? 'border-red-500 bg-red-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${className || ''}
          `}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
    );
  },
);

InputField.displayName = "InputField";

export default InputField;