import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import type { ConfirmationModalProps } from './interface/IConfirmationModal';


const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading: externalLoading = false,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [clicked, setClicked] = useState(false);
  
  // Use external loading if provided, otherwise use internal
  const isLoading = externalLoading || internalLoading;

  // Reset states when modal closes - FIXED ESLINT ERROR
  useEffect(() => {
    // Only run this effect when isOpen changes from true to false
    if (!isOpen) {
      // Use a timeout to avoid state updates during render
      const timer = setTimeout(() => {
        setInternalLoading(false);
        setShowSuccess(false);
        setClicked(false);
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const styles = {
    danger: {
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
      iconBg: 'bg-red-900/25',
      iconColor: 'text-red-400',
      border: 'border-red-600/40',
      icon: AlertTriangle,
    },
    warning: {
      button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 active:bg-yellow-800',
      iconBg: 'bg-yellow-900/25',
      iconColor: 'text-yellow-400',
      border: 'border-yellow-600/40',
      icon: AlertTriangle,
    },
    info: {
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
      iconBg: 'bg-blue-900/25',
      iconColor: 'text-blue-400',
      border: 'border-blue-600/40',
      icon: Info,
    },
  }[type];

  const Icon = styles.icon;

  const handleConfirmClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    setClicked(true);
    setInternalLoading(true);
    
    try {
      // Add a small delay to show loading state (prevents flash)
      await Promise.all([
        onConfirm(),
        new Promise(resolve => setTimeout(resolve, 300)) // Minimum loading time for UX
      ]);
      
      setShowSuccess(true);
      
      // Close after showing success briefly
      setTimeout(() => {
        onClose();
      }, 500);
      
    } catch (error) {
      console.error('Confirmation action failed:', error);
      setInternalLoading(false);
      setClicked(false);
    }
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop with blur effect - CHANGED THIS */}
        <div
          className={`fixed inset-0 transition-all duration-300 ${
            isOpen ? 'backdrop-blur-md bg-gray-900/30' : 'backdrop-blur-0 bg-transparent'
          }`}
          style={{ zIndex: 9998 }}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />

        {/* Center modal trick */}
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal panel with scale animation */}
        <div
          className={`inline-block transform overflow-hidden rounded-lg bg-gray-800 text-left align-bottom shadow-xl transition-all duration-300 sm:my-8 sm:w-full sm:max-w-lg sm:align-middle border ${styles.border} ${
            isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          style={{ 
            zIndex: 10000,
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              {/* Icon with pulse animation when loading */}
              <div
                className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${styles.iconBg} sm:mx-0 sm:h-10 sm:w-10 border ${styles.border} ${
                  isLoading ? 'animate-pulse' : ''
                }`}
              >
                {showSuccess ? (
                  <svg
                    className="h-6 w-6 text-green-400 animate-bounce"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <Icon className={`h-6 w-6 ${styles.iconColor}`} />
                )}
              </div>

              {/* Content */}
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-200">
                  {showSuccess ? 'Done!' : title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-400">
                    {showSuccess ? 'Operation completed successfully.' : message}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="bg-gray-900 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            {/* Confirm Button */}
            <button
              type="button"
              disabled={isLoading || showSuccess}
              className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 sm:ml-3 sm:w-auto sm:text-sm transition-all ${
                styles.button
              } ${
                isLoading || showSuccess ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'
              }`}
              onClick={handleConfirmClick}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : showSuccess ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Completed
                </>
              ) : (
                confirmText
              )}
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              disabled={isLoading || showSuccess}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-base font-medium text-gray-300 shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
              onClick={handleCloseClick}
            >
              {cancelText}
            </button>
          </div>

          {/* Click feedback ripple for confirm button */}
          {clicked && !isLoading && (
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full animate-ping pointer-events-none" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;