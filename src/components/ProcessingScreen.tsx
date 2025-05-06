
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLogo from './AppLogo';
import { toast } from '@/components/ui/use-toast'; // Import toast for error messages

const ProcessingScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { imageUrl } = location.state || { 
    imageUrl: 'https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3' 
  };
  
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Initializing..."); // Add status message state

  // Function to convert data URL to Blob
  const dataURLtoBlob = (dataurl: string): Blob | null => {
    try {
      const arr = dataurl.split(',');
      if (arr.length < 2) return null;
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch || mimeMatch.length < 2) return null;
      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while(n--){
          u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], {type:mime});
    } catch (e) {
      console.error("Error converting data URL to Blob:", e);
      return null;
    }
  }

  useEffect(() => {
    const identifyPlant = async () => {
      setStatusMessage("Preparing image...");
      setProgress(10);

      const blob = dataURLtoBlob(imageUrl);

      if (!blob) {
        setStatusMessage("Error processing image data.");
        toast({
          title: "Error",
          description: "Could not process the image data. Please try again.",
          variant: "destructive",
        });
        // Optionally navigate back or show a retry button
        setTimeout(() => navigate('/'), 3000); // Go back home after delay
        return;
      }

      const formData = new FormData();
      // Use a generic filename like 'upload.jpg' or derive from mime type if possible
      const filename = `upload.${blob.type.split('/')[1] || 'jpg'}`; 
      formData.append('file', blob, filename);

      setStatusMessage("Sending image for identification...");
      setProgress(30);

      try {
        // Ensure the backend URL is correct (adjust if needed)
        const backendUrl = 'http://localhost:8004/predict'; 
        console.log(`Sending request to: ${backendUrl}`); // Log the URL
        
        const response = await fetch(backendUrl, { 
          method: 'POST',
          body: formData,
        });

        setProgress(70);
        setStatusMessage("Receiving identification results...");

        if (!response.ok) {
          // Try to get error details from response body
          let errorMsg = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            // Use the specific error message from backend if available
            errorMsg = errorData.error || errorData.detail || `Server responded with status ${response.status}`; 
            console.error("Backend error response:", errorData);
          } catch (e) { 
             console.error("Could not parse error response as JSON:", await response.text());
          }
          
          throw new Error(errorMsg);
        }

        const data = await response.json();
        console.log("Received data from backend:", data); // Log successful response
        setProgress(100);
        setStatusMessage("Identification complete!");

        // Check if the response indicates a plant and has suggestions
        if (data.is_plant && data.suggestions && data.suggestions.length > 0) {
          navigate('/results', { 
            state: { 
              imageUrl,
              results: data.suggestions, // Pass the actual results from the API
              apiResponse: data // Optionally pass the full API response
            } 
          });
        } else {
           // Handle cases where backend says it's not a plant or returns no suggestions
           const description = data.error || "The identification service did not find a plant or could not provide suggestions.";
           toast({
             title: "Identification Failed",
             description: description,
             variant: "default", 
           });
           setTimeout(() => navigate('/'), 3000); // Go back home
        }

      } catch (error) {
        console.error('Error during plant identification fetch:', error);
        setProgress(0); // Reset progress on error
        const errorDescription = error instanceof Error ? error.message : 'An unknown network error occurred.';
        
        // Provide more specific feedback for common errors
        const displayError = errorDescription.includes("Failed to fetch") 
          ? "Could not connect to the plant identification service. Please check if the backend server is running and accessible at http://localhost:8004."
          : `Identification failed: ${errorDescription}`;
          
        setStatusMessage("Error during identification.");
        toast({
          title: "Identification Error",
          description: displayError,
          variant: "destructive",
        });
        // Navigate back home after showing the error
        setTimeout(() => navigate('/'), 4000); 
      }
    };

    identifyPlant();

    // No explicit cleanup needed for fetch, but keep the structure
    return () => { /* Potential cleanup if needed in future */ };
  }, [navigate, imageUrl]); // Dependencies for the effect

  // Simplified status message logic using the state variable
  const getStatusMessage = () => {
    return statusMessage;
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <AppLogo size="medium" className="mx-auto mb-8" />
        
        <h2 className="text-xl font-bold text-text mb-3">Identifying Your Plant</h2>
        <p className="text-text-muted mb-2">{getStatusMessage()}</p>
        
        {/* Loading animation with percentage */}
        <div className="w-full h-2 bg-muted rounded-full mb-2">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <p className="text-xs text-text-muted mb-8">{progress}% complete</p>
        
        <div className="rounded-lg overflow-hidden bg-muted relative h-48 mb-4">
          <img 
            src={imageUrl} 
            alt="Plant being identified" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-black/30 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-white border-t-transparent animate-spin" />
            </div>
          </div>
        </div>
        
        <p className="text-sm text-text-muted">
          Using advanced image recognition to identify your plant
        </p>
      </div>
    </div>
  );
};

export default ProcessingScreen;
