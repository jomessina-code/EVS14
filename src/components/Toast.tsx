import React from 'react';

interface ToastProps {
  message: string;
}

const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 bg-gray-800 text-white py-3 px-5 rounded-lg shadow-lg border border-purple-600 animate-fade-in-up z-50">
      <p>{message}</p>
    </div>
  );
};

export default Toast;
