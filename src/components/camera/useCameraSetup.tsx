import { useState, useEffect, useRef } from 'react';
import { toast } from "@/hooks/use-toast";

export const useCameraSetup = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraSupported, setIsCameraSupported] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Function to start the camera - based on the working implementation
  const startCamera = async () => {
    try {
      if (!videoRef.current) {
        console.error("Video element not available");
        setErrorMessage("Video element not available. Please reload the page.");
        return;
      }

      console.log("Requesting camera access...");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Prefer back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;
      
      try {
        await videoRef.current.play();
        console.log("Camera started successfully.");
        setHasPermission(true);
      } catch (playError) {
        console.error("Error playing video:", playError);
        setErrorMessage("Failed to start video playback. Please refresh the page.");
        setHasPermission(false);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setHasPermission(false);
      
      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            setErrorMessage("Camera permission denied. Please grant camera access in your browser.");
            toast({
              title: "Permission denied",
              description: "Please allow camera access in your browser settings.",
              variant: "destructive"
            });
            break;
          case 'NotFoundError':
          case 'DevicesNotFoundError':
            setErrorMessage("No camera found. Please check your device's camera.");
            toast({
              title: "No camera found",
              description: "Make sure your device has a camera and it's not being used by another application.",
              variant: "destructive"
            });
            break;
          default:
            setErrorMessage(`Camera error: ${err.name}`);
            toast({
              title: "Camera error",
              description: "There was an error accessing your camera.",
              variant: "destructive"
            });
        }
      } else {
        setErrorMessage("Failed to access camera. Please try again.");
        toast({
          title: "Camera error",
          description: "An unexpected error occurred.",
          variant: "destructive"
        });
      }
    }
  };

  // Function to stop the camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setStream(null);
      console.log("Camera stopped.");
    }
  };

  // Function to capture image from canvas
  const captureImage = (): string | null => {
    if (!stream || !videoRef.current || !canvasRef.current) {
      console.error("Camera stream or elements not available.");
      setErrorMessage("Camera not available. Please start the camera first.");
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      console.error("Canvas context not available.");
      setErrorMessage("Failed to get canvas context.");
      return null;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    console.log("Attempting to draw video frame to canvas...");
    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      console.log("Successfully drew video frame to canvas.");
      
      // Convert to data URL
      return canvas.toDataURL('image/jpeg', 0.9);
    } catch (drawError) {
      console.error("Error drawing video frame to canvas:", drawError);
      setErrorMessage(`Error capturing image: ${drawError instanceof Error ? drawError.message : 'Unknown error'}`);
      return null;
    }
  };

  // Start camera on component mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      console.log("Camera API is supported, attempting to start camera");
      startCamera();
    } else {
      console.error("Camera API is not supported");
      setIsCameraSupported(false);
      setErrorMessage("Camera API is not supported in your browser.");
      toast({
        title: "Camera not supported",
        description: "Your browser doesn't support camera access. Try using Chrome, Firefox, or Safari.",
        variant: "destructive"
      });
    }

    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, []);

  return {
    isCapturing,
    setIsCapturing,
    hasPermission,
    setHasPermission,
    errorMessage,
    setErrorMessage,
    isCameraSupported,
    videoRef,
    canvasRef,
    stream,
    startCamera,
    stopCamera,
    captureImage
  };
};
