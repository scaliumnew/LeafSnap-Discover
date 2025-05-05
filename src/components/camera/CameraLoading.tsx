
import React from 'react';
import { Camera } from 'lucide-react';

const CameraLoading: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center p-6">
      <Camera size={48} className="text-primary mb-4 animate-pulse" />
      <p className="text-white text-center px-4 text-xl mb-4">
        Requesting camera permission...
      </p>
      <p className="text-white/70 text-center text-sm px-8 mb-6">
        Please allow access to your camera when prompted by your browser
      </p>
      <div className="flex justify-center">
        <div className="w-12 h-1 bg-primary/50 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default CameraLoading;
