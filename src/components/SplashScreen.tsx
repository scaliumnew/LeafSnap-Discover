
import React from 'react';
import AppLogo from './AppLogo';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-primary to-primary-light animate-fade-in">
      <AppLogo size="large" className="animate-pulse mb-6" />
      <h1 className="text-white text-xl font-bold mt-4">Leaf Snap Discover</h1>
      <p className="text-white opacity-80 mt-2">Discover Plants with a Snap</p>
    </div>
  );
};

export default SplashScreen;
