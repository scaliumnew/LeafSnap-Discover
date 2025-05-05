import React, { useCallback, useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Leaf, Camera, Upload, Image as ImageIcon, AlertTriangle } from 'lucide-react';

interface SimpleCameraComponentProps {
  onCapture: (imageSrc: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const SimpleCameraComponent: React.FC<SimpleCameraComponentProps> = ({
  onCapture,
  onError,
  onClose,
  isLoading = false
}) => {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraNotSupported, setCameraNotSupported] = useState(false);
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);

  // Check if getUserMedia is supported
  useEffect(() => {
    const checkCameraSupport = () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log("getUserMedia is not supported in this browser");
        setCameraNotSupported(true);
        setCameraErrorMessage("Camera not supported in this browser. Please use image upload instead.");
      }
    };
    
    checkCameraSupport();
  }, []);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment"
  };

  const handleCapture = useCallback(() => {
    if (cameraNotSupported) return;
    
    setIsCapturing(true);
    
    try {
      const imageSrc = webcamRef.current?.getScreenshot();
      
      if (imageSrc) {
        onCapture(imageSrc);
      } else {
        onError("Failed to capture image. Please try again.");
      }
    } catch (error) {
      console.error("Error capturing image:", error);
      onError("Failed to capture image: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsCapturing(false);
    }
  }, [onCapture, onError, cameraNotSupported]);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    console.error("Camera error:", error);
    
    // Check if it's a getUserMedia not implemented error
    const errorMessage = error instanceof DOMException ? error.message : String(error);
    if (errorMessage.includes("getUserMedia is not implemented") || 
        errorMessage.includes("not implemented") ||
        errorMessage.includes("NotAllowedError") ||
        errorMessage.includes("NotFoundError")) {
      setCameraNotSupported(true);
      setCameraErrorMessage(`Camera access error: ${errorMessage}`);
    }
    
    onError(`Camera access error: ${error instanceof DOMException ? error.message : error}`);
  }, [onError]);

  const handleUserMedia = useCallback(() => {
    console.log("Camera ready");
    setIsCameraReady(true);
  }, []);
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      onError("Please select an image file");
      return;
    }
    
    // Convert the file to a base64 string
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        onCapture(result);
      } else {
        onError("Failed to read the image file");
      }
    };
    reader.onerror = () => {
      onError("Failed to read the image file");
    };
    reader.readAsDataURL(file);
  };
  
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button 
          onClick={onClose}
          className="p-2 rounded-full bg-black/50 text-white"
          aria-label="Close camera"
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
        </button>
      </div>

      {/* Camera container */}
      <div className="flex-grow relative overflow-hidden" style={{ height: "calc(100% - 120px)" }}>
        {!cameraNotSupported && (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            onUserMediaError={handleUserMediaError}
            onUserMedia={handleUserMedia}
            className="w-full h-full object-cover"
            style={{ background: '#000' }}
            mirrored={false}
          />
        )}

        {/* Camera not supported message */}
        {cameraNotSupported && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black p-6">
            <AlertTriangle size={48} className="text-yellow-400 mb-4" />
            <h2 className="text-white text-xl font-bold mb-2">Camera Not Available</h2>
            <p className="text-white text-center mb-6">
              {cameraErrorMessage || "Camera access is not available in this browser or device."}
            </p>
            <p className="text-gray-300 text-center mb-8">
              You can still identify plants by uploading an image instead.
            </p>
            <button
              onClick={triggerFileUpload}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center"
              disabled={isLoading}
            >
              <Upload size={20} className="mr-2" />
              Upload Plant Image
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleFileUpload} 
              className="hidden"
            />
          </div>
        )}

        {/* Loading indicator */}
        {!isCameraReady && !cameraNotSupported && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <Camera size={48} className="text-white mb-4 animate-pulse" />
            <p className="text-white text-center px-4 text-xl">
              Accessing camera...
            </p>
          </div>
        )}

        {/* Processing indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4" />
            <p className="text-white text-center px-4 text-xl">
              Processing image...
            </p>
          </div>
        )}
        
        {/* Framing guide - only show when camera is working */}
        {!cameraNotSupported && isCameraReady && (
          <>
            <div className="absolute inset-0 border-2 border-white/40 m-8 rounded-lg pointer-events-none" />
            
            {/* Plant positioning instructions */}
            <div className="absolute bottom-28 inset-x-0 bg-black/60 p-4 text-white text-center flex items-center justify-center space-x-2">
              <Leaf size={20} className="text-green-400" />
              <p>Position the plant in the frame</p>
            </div>
          </>
        )}
      </div>

      {/* Capture button container */}
      <div className="bg-black h-24 flex items-center justify-center w-full shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] z-20 relative">
        {/* Show either capture button or upload button based on camera support */}
        {!cameraNotSupported ? (
          <button
            onClick={handleCapture}
            disabled={!isCameraReady || isCapturing || isLoading}
            className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform ${
              !isCameraReady || isCapturing || isLoading ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
            }`}
            aria-label="Take photo"
          >
            <div className="w-14 h-14 rounded-full bg-white" />
          </button>
        ) : (
          <button
            onClick={triggerFileUpload}
            disabled={isLoading}
            className={`px-6 py-3 bg-green-600 rounded-full text-white flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
            }`}
            aria-label="Upload photo"
          >
            <ImageIcon size={20} className="mr-2" />
            Upload Image
          </button>
        )}
      </div>
      
      {/* Capture Feedback */}
      {isCapturing && (
        <div className="absolute inset-0 bg-white animate-pulse opacity-30 z-10" />
      )}
    </div>
  );
};

export default SimpleCameraComponent; 