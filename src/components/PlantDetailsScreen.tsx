
import React from 'react';
import { ArrowLeft, Droplets, Sun, Thermometer, Info } from 'lucide-react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

interface PlantDetails {
  id: string;
  name: string;
  commonNames: string[];
  family: string;
  imageUrl: string;
  description: string;
  waterNeeds: 'Low' | 'Medium' | 'High';
  sunlight: 'Full Sun' | 'Partial Shade' | 'Shade';
  temperature: string;
  careLevel: 'Easy' | 'Moderate' | 'Difficult';
}

const PlantDetailsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { plantId } = useParams<{ plantId: string }>();
  
  // Use passed state or create mock data
  const plantDetails: PlantDetails = location.state?.plant || {
    id: plantId || '1',
    name: 'Monstera Deliciosa',
    commonNames: ['Swiss Cheese Plant', 'Split-leaf Philodendron'],
    family: 'Araceae',
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=1364&auto=format&fit=crop',
    description: 'Monstera deliciosa is a species of flowering plant native to tropical forests of southern Mexico, south to Panama. It has been introduced to many tropical areas, and has become a mildly invasive species in Hawaii, Seychelles, Ascension Island and the Society Islands.',
    waterNeeds: 'Medium',
    sunlight: 'Partial Shade',
    temperature: '65-85°F (18-29°C)',
    careLevel: 'Easy',
  };

  // Determine color for water needs
  const getWaterColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-amber-500';
      case 'Medium': return 'text-primary';
      case 'High': return 'text-blue-500';
      default: return 'text-primary';
    }
  };

  // Determine color for sunlight needs
  const getSunlightColor = (level: string) => {
    switch (level) {
      case 'Full Sun': return 'text-amber-500';
      case 'Partial Shade': return 'text-amber-400';
      case 'Shade': return 'text-text-muted';
      default: return 'text-amber-400';
    }
  };

  // Determine color for care level
  const getCareColor = (level: string) => {
    switch (level) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Moderate': return 'bg-amber-100 text-amber-800';
      case 'Difficult': return 'bg-red-100 text-red-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gradient-primary text-white">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-black/10 text-white mr-4"
          aria-label="Go back"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold flex-grow">Plant Details</h1>
      </div>
      
      {/* Content Scroll Area */}
      <div className="flex-grow overflow-y-auto">
        {/* Hero Image */}
        <div className="h-64 relative">
          <img 
            src={plantDetails.imageUrl} 
            alt={plantDetails.name} 
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        
        {/* Plant Info */}
        <div className="p-6">
          <h1 className="text-2xl font-bold text-text">{plantDetails.name}</h1>
          <p className="text-text-muted mb-2">{plantDetails.commonNames.join(', ')}</p>
          
          <div className="flex items-center mb-6">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getCareColor(plantDetails.careLevel)}`}>
              {plantDetails.careLevel} care
            </span>
            <span className="ml-2 text-xs text-text-muted">Family: {plantDetails.family}</span>
          </div>
          
          {/* Care Information */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-muted rounded-lg p-3 flex flex-col items-center text-center">
              <Droplets size={24} className={getWaterColor(plantDetails.waterNeeds)} />
              <span className="text-xs font-medium mt-1">Water</span>
              <span className="text-xs text-text-muted">{plantDetails.waterNeeds}</span>
            </div>
            <div className="bg-muted rounded-lg p-3 flex flex-col items-center text-center">
              <Sun size={24} className={getSunlightColor(plantDetails.sunlight)} />
              <span className="text-xs font-medium mt-1">Light</span>
              <span className="text-xs text-text-muted">{plantDetails.sunlight}</span>
            </div>
            <div className="bg-muted rounded-lg p-3 flex flex-col items-center text-center">
              <Thermometer size={24} className="text-red-400" />
              <span className="text-xs font-medium mt-1">Temp</span>
              <span className="text-xs text-text-muted">{plantDetails.temperature}</span>
            </div>
          </div>
          
          {/* Description */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-2">About</h2>
            <p className="text-text-muted text-sm leading-relaxed">
              {plantDetails.description}
            </p>
          </div>
          
          {/* Care Tips */}
          <div className="bg-muted p-4 rounded-lg mb-8">
            <div className="flex items-start mb-2">
              <Info size={16} className="text-primary mt-1 mr-2" />
              <h2 className="text-md font-bold">Care Tips</h2>
            </div>
            <ul className="text-sm text-text-muted space-y-2 pl-7">
              <li>Water when the top inch of soil feels dry</li>
              <li>Place in bright, indirect light</li>
              <li>Keep away from cold drafts</li>
              <li>Wipe leaves occasionally to remove dust</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantDetailsScreen;
