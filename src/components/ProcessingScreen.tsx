
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLogo from './AppLogo';

const ProcessingScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { imageUrl } = location.state || { 
    imageUrl: 'https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3' 
  };
  
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate ML Kit processing with progressive updates
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    // Simulate image analysis and generate plant identification results
    const timer = setTimeout(() => {
      // Create mock results similar to what ML Kit would provide
      const results = [
        {
          id: '1',
          name: 'Monstera Deliciosa',
          confidence: 0.92,
          imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.0.3',
          commonNames: ['Swiss Cheese Plant', 'Split-leaf Philodendron'],
          family: 'Araceae',
          care: 'Bright indirect light, water when top inch of soil is dry'
        },
        {
          id: '2',
          name: 'Monstera Adansonii',
          confidence: 0.78,
          imageUrl: 'https://images.unsplash.com/photo-1598880940639-93b202203e18?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3',
          commonNames: ['Adanson\'s Monstera', 'Swiss Cheese Vine'],
          family: 'Araceae',
          care: 'Medium to bright indirect light, keep soil lightly moist'
        },
        {
          id: '3',
          name: 'Epipremnum Aureum',
          confidence: 0.65,
          imageUrl: 'https://images.unsplash.com/photo-1616500631550-6c4e08e5d82d?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3',
          commonNames: ['Pothos', 'Devil\'s Ivy'],
          family: 'Araceae',
          care: 'Versatile, can grow in low to bright indirect light, allow to dry between waterings'
        },
      ];
      
      navigate('/results', { 
        state: { 
          imageUrl,
          results
        } 
      });
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [navigate, imageUrl]);

  // Get a descriptive message based on progress
  const getStatusMessage = () => {
    if (progress < 25) return "Analyzing image features...";
    if (progress < 50) return "Detecting plant characteristics...";
    if (progress < 75) return "Matching with plant database...";
    return "Finalizing identification...";
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
