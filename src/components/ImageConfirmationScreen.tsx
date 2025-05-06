
import React from 'react';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const ImageConfirmationScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { imageUrl, imageSource } = location.state || { 
    imageUrl: 'https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?q=80&w=1470&auto=format&fit=crop',
    imageSource: 'camera' 
  };

  const handleConfirm = () => {
    navigate('/processing', { 
      state: { imageUrl } 
    });
  };

  const handleCancel = () => {
    if (imageSource === 'camera') {
      navigate('/camera');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center justify-between bg-black/80">
          <button 
            onClick={handleCancel}
            className="p-2 rounded-full bg-black/50 text-white"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-white font-medium">Confirm Image</h2>
          <div className="w-10" /> {/* Empty div for spacing */}
        </div>
        
        {/* Image Preview */}
        <div className="flex-grow relative">
          <img 
            src={imageUrl} 
            alt="Plant to identify" 
            className="absolute inset-0 w-full h-full object-contain" // Changed from object-cover
          />
        </div>
        
        {/* Action Buttons */}
        <div className="h-20 bg-black flex items-center justify-around pb-4 px-6">
          <button
            onClick={handleCancel}
            className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg"
            aria-label="Retake photo"
          >
            <X size={28} className="text-white" />
          </button>
          
          <button
            onClick={handleConfirm}
            className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg"
            aria-label="Confirm photo"
          >
            <Check size={28} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageConfirmationScreen;
