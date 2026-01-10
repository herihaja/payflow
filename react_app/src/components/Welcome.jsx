import React from "react";

const Welcome = ({}) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="card p-8 sm:p-16 text-center max-w-md animate-fade-in">
        <div className="inline-block p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-6">
          <svg
            className="w-12 h-12 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h2 className="text-3xl sm:text-4xl font-poppins font-bold text-gray-900 mb-3">
          Welcome to PayFlow
        </h2>
        <p className="text-gray-600 text-base sm:text-lg mb-8 leading-relaxed">
          A powerful solution for managing your payment batches seamlessly.
        </p>
        <p className="text-gray-500 text-sm">Please sign in to continue</p>
      </div>
    </div>
  );
};

export default Welcome;
