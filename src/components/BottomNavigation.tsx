
import React from 'react';
import { Home, Search, History, HelpCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: History, label: 'History', path: '/history' },
    { icon: HelpCircle, label: 'Help', path: '/help' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex justify-around items-center z-10">
      {navItems.map((item) => {
        const isActive = currentPath === item.path;
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center justify-center w-1/4 h-full"
          >
            <item.icon 
              size={24} 
              className={isActive ? 'text-primary' : 'text-text-muted'} 
            />
            <span 
              className={`text-xs mt-1 ${
                isActive ? 'text-primary font-medium' : 'text-text-muted'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNavigation;
