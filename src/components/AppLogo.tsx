
import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: "small" | "medium" | "large";
}

const AppLogo: React.FC<AppLogoProps> = ({ className = "", size = "medium" }) => {
  const sizeClasses = {
    small: "w-10 h-10",
    medium: "w-16 h-16",
    large: "w-32 h-32"
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Stylized leaf */}
        <path
          d="M50 10 C20 10, 10 30, 10 50 C10 75, 30 90, 50 90 C70 90, 90 75, 90 50 C90 30, 80 10, 50 10 Z"
          fill="#2ECC71"
          stroke="#27AE60"
          strokeWidth="2"
        />
        <path
          d="M30 40 C40 30, 60 30, 70 40 C80 50, 70 70, 50 80 C30 70, 20 50, 30 40 Z"
          fill="#76D7C4"
          stroke="none"
        />
        <path
          d="M50 30 L50 80"
          stroke="#27AE60"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M35 45 Q50 40 65 45"
          stroke="#27AE60"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M30 55 Q50 50 70 55"
          stroke="#27AE60"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M35 65 Q50 60 65 65"
          stroke="#27AE60"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
};

export default AppLogo;
