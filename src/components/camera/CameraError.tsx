
import React from 'react';
import { AlertCircle, CameraOff } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface CameraErrorProps {
  errorMessage: string | null;
  onTryAgain: () => void;
  onUseDefaultImage: () => void;
}

const CameraError: React.FC<CameraErrorProps> = ({
  errorMessage,
  onTryAgain,
  onUseDefaultImage
}) => {
  // Determine if it's a permission error
  const isPermissionError = errorMessage?.includes('permission') || 
                           errorMessage?.includes('denied') ||
                           errorMessage?.includes('Permission');

  return (
    <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center p-6">
      <div className="rounded-full bg-red-500/20 p-4 mb-4">
        {isPermissionError ? (
          <CameraOff size={40} className="text-red-500" />
        ) : (
          <AlertCircle size={40} className="text-red-500" />
        )}
      </div>
      
      <Alert variant="destructive" className="mb-6 max-w-md">
        <AlertTitle>Camera Access Error</AlertTitle>
        <AlertDescription>
          {errorMessage || 'Camera access denied. Please enable camera permissions.'}
          
          {isPermissionError && (
            <div className="mt-3 text-xs">
              <p className="font-semibold">How to fix:</p>
              <ol className="list-decimal pl-4 mt-1">
                <li>Click on the camera icon in your browser's address bar</li>
                <li>Select "Allow" for camera access</li>
                <li>Refresh the page</li>
              </ol>
            </div>
          )}
        </AlertDescription>
      </Alert>
      
      <div className="flex flex-col space-y-3 w-full max-w-xs">
        <button 
          onClick={onTryAgain}
          className="bg-primary text-white py-3 px-4 rounded-md font-medium"
        >
          Try Again
        </button>
        <button
          onClick={onUseDefaultImage}
          className="bg-muted text-text py-3 px-4 rounded-md"
        >
          Use Default Image
        </button>
      </div>
    </div>
  );
};

export default CameraError;
