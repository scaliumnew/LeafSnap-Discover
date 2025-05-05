
import React from 'react';
import { Camera } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick
}) => {
  return (
    <button 
      onClick={onClick} 
      aria-label="Take a photo" 
      className="fixed z-20 bottom-28 right-1/2 translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-500 hover:to-green-400 transition-all focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
    >
      <Camera size={28} className="text-white" />
    </button>
  );
};

export default FloatingActionButton;
