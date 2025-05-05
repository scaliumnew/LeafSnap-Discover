
import React from 'react';
import { X, Camera, Image, Search, Leaf, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HelpScreen = () => {
  const navigate = useNavigate();

  const helpItems = [
    {
      icon: Camera,
      title: 'Take a Photo',
      description: 'Use your camera to take a clear photo of a plant you want to identify.'
    },
    {
      icon: Image,
      title: 'Use Gallery Image',
      description: 'Select an existing plant photo from your device gallery.'
    },
    {
      icon: Leaf,
      title: 'Get Identification',
      description: 'Our AI will analyze the image and provide possible plant matches.'
    },
    {
      icon: Search,
      title: 'Search Plants',
      description: 'Look up plants by name if you already know what you\'re looking for.'
    },
    {
      icon: AlertCircle,
      title: 'Tips for Best Results',
      description: 'Focus on leaves, flowers, or distinctive features. Ensure good lighting and a clear background.'
    }
  ];

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gradient-primary text-white">
        <h1 className="text-xl font-bold flex-grow">Help & Tips</h1>
        <button 
          onClick={() => navigate('/')}
          className="p-2 rounded-full bg-black/10 text-white"
          aria-label="Close help"
        >
          <X size={24} />
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-grow overflow-y-auto p-6">
        <p className="text-text-muted mb-6">
          Welcome to Leaf Snap Discover! Here's how to make the most of the app:
        </p>
        
        <div className="space-y-8">
          {helpItems.map((item, index) => (
            <div key={index} className="flex">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4 flex-shrink-0">
                <item.icon size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-text mb-1">{item.title}</h2>
                <p className="text-text-muted text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-bold text-text mb-2">About Accuracy</h3>
          <p className="text-sm text-text-muted">
            Plant identification is based on visual analysis and may not always be 100% accurate. 
            Always verify important plant information, especially if you're concerned about toxicity or edibility.
          </p>
        </div>
        
        <div className="text-center mt-8 mb-4">
          <p className="text-sm text-text-muted">
            App Version 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpScreen;
