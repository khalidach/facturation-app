import React from "react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "sm:max-w-lg",
    md: "sm:max-w-xl",
    lg: "sm:max-w-3xl",
    xl: "sm:max-w-5xl",
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50">
      <div
        className={`relative top-20 mx-auto p-5 border w-full shadow-lg rounded-md bg-white dark:bg-gray-800 ${sizeClasses[size]}`}
      >
        <div className="flex justify-between items-center pb-3 border-b">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </p>
          <div className="cursor-pointer z-50" onClick={onClose}>
            <svg
              className="fill-current text-black dark:text-white"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 18 18"
            >
              <path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"></path>
            </svg>
          </div>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
