import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/hooks/use-toast";
import SimpleCameraComponent from './camera/SimpleCameraComponent';

const CameraScreen = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleCapture = async (imageSrc: string) => {
    setIsLoading(true);
    console.log("Image captured, processing...");

    try {
      // Check if backend is accessible first
      try {
        const healthCheck = await fetch('/api/health');
        if (!healthCheck.ok) {
          throw new Error("Backend server is not responding");
        }
        const health = await healthCheck.json();
        if (health.status !== "ok") {
          throw new Error("Backend server is not healthy");
        }
      } catch (error) {
        console.error("Backend connection error:", error);
        throw new Error("Cannot connect to the backend server. Please make sure it's running.");
      }

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

      // Send image to the plant-species-recognition backend
      const response = await fetch('/predict', {
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

      // Check if a plant was detected
      if (!data.is_plant) {
        navigate('/results', {
          state: {
            imageUrl: imageSrc,
            classification: null,
            details: null,
            rawData: data
          }
        });
        return;
      }

      // Process the plant identification results
      let plantName = "Unknown Plant";
      let plantDetails = "No details available";

      if (data.suggestions && data.suggestions.length > 0) {
        const topSuggestion = data.suggestions[0];
        plantName = topSuggestion.plant_name || "Unknown Plant";
        
        // Format details
        const probability = (topSuggestion.probability * 100).toFixed(1);
        let commonName = "N/A";
        if (topSuggestion.plant_details && 
            topSuggestion.plant_details.common_names && 
            topSuggestion.plant_details.common_names.length > 0) {
          commonName = topSuggestion.plant_details.common_names[0];
        }
        
        plantDetails = `Scientific Name: ${plantName}\nCommon Name: ${commonName}\nConfidence: ${probability}%`;
      }

      // Navigate to results screen with the plant information
      navigate('/results', {
        state: {
          imageUrl: imageSrc,
          classification: plantName,
          details: plantDetails,
          rawData: data
        }
      });
    } catch (err) {
      console.error('Error processing image:', err);
      let errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Handle specific error cases
      if (errorMessage.includes('Cannot connect to the backend server')) {
        navigate('/results', {
          state: {
            imageUrl: imageSrc,
            classification: null,
            details: null,
            rawData: {
              is_plant: false,
              error: errorMessage
            }
          }
        });
        return;
      }
      
      toast({
        title: "Image processing failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (error: string) => {
    console.error("Camera error:", error);
    toast({
      title: "Camera error",
      description: error,
      variant: "destructive"
    });
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
