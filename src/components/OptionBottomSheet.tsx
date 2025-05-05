
import React, { useState, useEffect } from 'react';
import { Camera, Image, X } from 'lucide-react';

interface OptionBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCameraSelect: () => void;
  onGallerySelect: () => void;
}

const OptionBottomSheet: React.FC<OptionBottomSheetProps> = ({
  isOpen,
  onClose,
  onCameraSelect,
  onGallerySelect,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black z-30 transition-opacity duration-300 ${
          isAnimating ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-xl z-40 p-6 transform transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-text">Identify a Plant</h3>
          <button 
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-muted"
            aria-label="Close dialog"
          >
            <X size={24} className="text-text-muted" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => {
              onCameraSelect();
              handleClose();
            }}
            className="flex flex-col items-center p-4 rounded-lg border-2 border-primary text-text hover:bg-muted transition-colors"
          >
            <Camera size={36} className="text-primary mb-2" />
            <span className="font-medium">Take Photo</span>
          </button>
          
          <button 
            onClick={() => {
              onGallerySelect();
              handleClose();
            }}
            className="flex flex-col items-center p-4 rounded-lg border-2 border-primary text-text hover:bg-muted transition-colors"
          >
            <Image size={36} className="text-primary mb-2" />
            <span className="font-medium">Choose from Gallery</span>
          </button>
        </div>
        
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-6" />
      </div>
    </>
  );
};

export default OptionBottomSheet;
