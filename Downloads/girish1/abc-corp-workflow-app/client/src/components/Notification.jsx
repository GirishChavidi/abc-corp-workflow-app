import React from 'react';
import useStore from '../store';

export default function Notification() {
  const notification = useStore((s) => s.notification);
  if (!notification) return null;

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-pulse">
      <div className={`${colors[notification.type] || colors.info} text-white px-6 py-3 rounded-lg shadow-lg font-medium`}>
        {notification.message}
      </div>
    </div>
  );
}
