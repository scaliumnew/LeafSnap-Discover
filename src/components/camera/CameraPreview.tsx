import React from 'react';
import { Leaf } from 'lucide-react';
import FloatingActionButton from '../FloatingActionButton';
import { useIsMobile } from '@/hooks/use-mobile';

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isCapturing: boolean;
  onCapture: () => void;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({
  videoRef,
  isCapturing,
  onCapture
}) => {
  const isMobile = useIsMobile();
  
  return (
    <>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover bg-black"
        style={{ background: '#000' }}
      />
      
      {/* Framing guide */}
      <div className="absolute inset-0 border-2 border-white/40 m-8 rounded-lg pointer-events-none" />
      
      {/* Plant positioning instructions */}
      <div className="absolute bottom-24 inset-x-0 bg-black/60 p-4 text-white text-center flex items-center justify-center space-x-2">
        <Leaf size={20} className="text-green-400" />
        <p>Position the plant in the frame</p>
      </div>
      
      {/* Capture button */}
      {isMobile ? (
        <div className="absolute bottom-0 inset-x-0 bg-black/80 h-24 flex items-center justify-center">
          <button
            onClick={onCapture}
            disabled={isCapturing}
            className={`w-16 h-16 rounded-full border-4 border-white flex items-center justify-center ${
              isCapturing ? 'opacity-50' : ''
            }`}
            aria-label="Take photo"
          >
            <div className="w-12 h-12 rounded-full bg-white" />
          </button>
        </div>
      ) : (
        <FloatingActionButton onClick={onCapture} />
      )}
      
      {/* Capture Feedback */}
      {isCapturing && (
        <div className="absolute inset-0 bg-white animate-pulse opacity-30" />
      )}
    </>
  );
};

export default CameraPreview;
