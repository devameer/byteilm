import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import NotificationList from '../components/ui/NotificationList';

export default function Notifications() {
  const { darkMode } = useTheme();
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <NotificationList />
    </div>
  );
}
