
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Droplets, Sun, Thermometer, Info } from 'lucide-react';

interface SpeciesDetails {
  id: string;
  name: string;
  commonName: string;
  family: string;
  imageUrl: string;
  description: string;
  waterNeeds: 'Low' | 'Medium' | 'High';
  sunlight: 'Full Sun' | 'Partial Shade' | 'Shade';
  temperature: string;
  careLevel: 'Easy' | 'Moderate' | 'Difficult';
  origin: string;
  soil: string;
  propagation: string[];
  careTips: string[];
}

// Mock species data with detailed information
const speciesData: Record<string, SpeciesDetails> = {
  '1': {
    id: '1',
    name: 'Monstera Deliciosa',
    commonName: 'Swiss Cheese Plant',
    family: 'Araceae',
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.0.3',
    description: 'Monstera deliciosa is a species of flowering plant native to tropical forests of southern Mexico, south to Panama. It has been introduced to many tropical areas, and has become a mildly invasive species in Hawaii, Seychelles, Ascension Island and the Society Islands.',
    waterNeeds: 'Medium',
    sunlight: 'Partial Shade',
    temperature: '65-85°F (18-29°C)',
    careLevel: 'Easy',
    origin: 'Central America',
    soil: 'Well-draining potting mix with peat moss',
    propagation: ['Stem cuttings', 'Air layering'],
    careTips: [
      'Water when the top inch of soil feels dry',
      'Place in bright, indirect light',
      'Keep away from cold drafts',
      'Wipe leaves occasionally to remove dust'
    ],
  },
  '2': {
    id: '2',
    name: 'Sansevieria Trifasciata',
    commonName: 'Snake Plant',
    family: 'Asparagaceae',
    imageUrl: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3',
    description: 'Sansevieria trifasciata is a species of flowering plant in the family Asparagaceae, native to tropical West Africa. It is most commonly known as the snake plant, Saint George\'s sword, mother-in-law\'s tongue, and viper\'s bowstring hemp, among other names.',
    waterNeeds: 'Low',
    sunlight: 'Partial Shade',
    temperature: '70-90°F (21-32°C)',
    careLevel: 'Easy',
    origin: 'West Africa',
    soil: 'Sandy, well-draining soil',
    propagation: ['Leaf cuttings', 'Division'],
    careTips: [
      'Allow soil to dry completely between waterings',
      'Can tolerate low light conditions',
      'Drought tolerant',
      'Rarely needs repotting'
    ],
  },
  '3': {
    id: '3',
    name: 'Ficus Lyrata',
    commonName: 'Fiddle Leaf Fig',
    family: 'Moraceae',
    imageUrl: 'https://images.unsplash.com/photo-1616602416236-31d2f9e0a5d1?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.0.3',
    description: 'The fiddle-leaf fig (Ficus lyrata) is a species of flowering plant in the mulberry and fig family Moraceae. It is native to western Africa, from Cameroon west to Sierra Leone, where it grows in lowland tropical rainforest.',
    waterNeeds: 'Medium',
    sunlight: 'Full Sun',
    temperature: '65-75°F (18-24°C)',
    careLevel: 'Moderate',
    origin: 'Western Africa',
    soil: 'Rich, well-draining soil with peat moss',
    propagation: ['Stem cuttings', 'Air layering'],
    careTips: [
      'Water thoroughly when the top inch of soil is dry',
      'Needs bright, indirect light',
      'Sensitive to changes in environment',
      'Rotate occasionally for even growth'
    ],
  },
};

const SpeciesDetailsScreen: React.FC = () => {
  const { speciesId } = useParams<{ speciesId: string }>();
  const species = speciesId ? speciesData[speciesId] : null;
  
  if (!species) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-bold">Species not found</h2>
        <p className="mt-2 text-text-muted">The species you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

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
    <div className="pb-20">
      {/* Hero Image */}
      <div className="h-64 relative">
        <img 
          src={species.imageUrl} 
          alt={species.name} 
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      
      {/* Plant Info */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-text">{species.name}</h1>
        <p className="text-text-muted mb-2">{species.commonName}</p>
        
        <div className="flex items-center mb-6">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getCareColor(species.careLevel)}`}>
            {species.careLevel} care
          </span>
          <span className="ml-2 text-xs text-text-muted">Family: {species.family}</span>
        </div>
        
        {/* Care Information */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-muted rounded-lg p-3 flex flex-col items-center text-center">
            <Droplets size={24} className={getWaterColor(species.waterNeeds)} />
            <span className="text-xs font-medium mt-1">Water</span>
            <span className="text-xs text-text-muted">{species.waterNeeds}</span>
          </div>
          <div className="bg-muted rounded-lg p-3 flex flex-col items-center text-center">
            <Sun size={24} className={getSunlightColor(species.sunlight)} />
            <span className="text-xs font-medium mt-1">Light</span>
            <span className="text-xs text-text-muted">{species.sunlight}</span>
          </div>
          <div className="bg-muted rounded-lg p-3 flex flex-col items-center text-center">
            <Thermometer size={24} className="text-red-400" />
            <span className="text-xs font-medium mt-1">Temp</span>
            <span className="text-xs text-text-muted">{species.temperature}</span>
          </div>
        </div>
        
        {/* Description */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">About</h2>
          <p className="text-text-muted text-sm leading-relaxed">
            {species.description}
          </p>
        </div>
        
        {/* Origin */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">Origin</h2>
          <p className="text-text-muted text-sm">{species.origin}</p>
        </div>

        {/* Soil preference */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">Soil</h2>
          <p className="text-text-muted text-sm">{species.soil}</p>
        </div>

        {/* Propagation */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">Propagation</h2>
          <ul className="list-disc pl-5 text-text-muted text-sm">
            {species.propagation.map((method, index) => (
              <li key={index}>{method}</li>
            ))}
          </ul>
        </div>
        
        {/* Care Tips */}
        <div className="bg-muted p-4 rounded-lg mb-8">
          <div className="flex items-start mb-2">
            <Info size={16} className="text-primary mt-1 mr-2" />
            <h2 className="text-md font-bold">Care Tips</h2>
          </div>
          <ul className="text-sm text-text-muted space-y-2 pl-7">
            {species.careTips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SpeciesDetailsScreen;
