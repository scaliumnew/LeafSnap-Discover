import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/hooks/use-toast";
import SimpleCameraComponent from './camera/SimpleCameraComponent';

const CameraScreen = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [hasShownCameraError, setHasShownCameraError] = useState(false);

  // Only show toast for camera error once to avoid repeated error messages
  useEffect(() => {
    return () => {
      setHasShownCameraError(false); // Reset when component unmounts
    };
  }, []);

  const handleCapture = async (imageSrc: string) => {
    setIsLoading(true);
    console.log("Image captured, processing...");

    try {
      // Removed the health check as it used a relative path and isn't strictly necessary here.
      // We'll rely on the main predict call's error handling.

      // Extract base64 data
      const base64Data = imageSrc.split(',')[1];
      if (!base64Data) {
        throw new Error("Invalid image format: couldn't extract base64 data");
      }

      // Create a Blob from the base64 data
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArrays.push(byteCharacters.charCodeAt(i));
      }
      const blob = new Blob([new Uint8Array(byteArrays)], { type: 'image/jpeg' });
      console.log("Image blob created:", blob.size, "bytes");

      // Create FormData for the backend
      const formData = new FormData();
      formData.append('file', blob, 'capture.jpg');

      // Send image to the plant-species-recognition backend using the full URL
      const backendUrl = 'http://localhost:8004/predict'; // Use the correct backend URL
      console.log(`Sending request to: ${backendUrl}`); 
      const response = await fetch(backendUrl, { 
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Backend error response:', errorBody);
        throw new Error(`Backend error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      console.log("Plant identification data received:", data);

      // Navigate to results screen with the raw API data
      // ResultsScreen will handle displaying "No plant detected" based on apiResponse.is_plant
      navigate('/results', {
        state: {
          imageUrl: imageSrc,
          apiResponse: data // Pass the full response object
        }
      });

    } catch (err) {
      console.error('Error processing image:', err);
      const errorDescription = err instanceof Error ? err.message : 'An unknown error occurred.';
      
      // Provide specific feedback for fetch errors vs other errors
      const displayError = errorDescription.includes("Failed to fetch") || errorDescription.includes("NetworkError")
        ? "Could not connect to the plant identification service. Please check if the backend server is running and accessible at http://localhost:8004."
        : `Image processing failed: ${errorDescription}`;

      // Navigate to results screen showing the error
      navigate('/results', {
        state: {
          imageUrl: imageSrc,
          apiResponse: { // Construct an error response object
            is_plant: false, 
            error: displayError,
            suggestions: []
          }
        }
      });
      
      // Use the defined displayError variable for the toast
      toast({
        title: "Image processing failed",
        description: displayError, 
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (error: string) => {
    console.error("Camera error:", error);
    
    // Only show the toast once for camera errors
    if (!hasShownCameraError && (
      error.includes("getUserMedia is not implemented") || 
      error.includes("Camera access error")
    )) {
      setHasShownCameraError(true);
      toast({
        title: "Camera error",
        description: error,
        variant: "destructive"
      });
    } else if (!error.includes("Camera access error")) {
      // For non-camera errors, always show the toast
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <SimpleCameraComponent
      onCapture={handleCapture}
      onError={handleError}
      onClose={handleClose}
      isLoading={isLoading}
    />
  );
};

export default CameraScreen;
