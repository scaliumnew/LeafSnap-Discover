import React from 'react';
import { ArrowLeft, Info, Leaf, Search, ExternalLink, Camera } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface PlantImage {
  url: string;
  caption: string;
}

interface PlantDetails {
  common_names: string[];
  wiki_description: {
    value: string;
  };
  taxonomy: {
    family: string;
    genus: string;
    species: string;
  };
  url: string;
  images: PlantImage[];
  flower_details?: {
    color: string;
    blooming_season: string;
    petal_count?: string;
    flower_size?: string;
    fragrance?: string;
    care_level?: string;
  };
}

interface PlantSuggestion {
  id: number;
  plant_name: string;
  probability: number;
  plant_details: PlantDetails;
}

interface PlantResponse {
  is_plant: boolean;
  has_flower: boolean;
  detected_from_screen: boolean;
  confidence: number;
  error?: string;
  screen_message?: string;
  suggestions: PlantSuggestion[];
}

const ResultsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { imageUrl, classification, details, rawData } = location.state || { 
    imageUrl: null,
    classification: 'No classification received',
    details: null,
    rawData: null
  };

  const plantData = rawData?.suggestions?.[0] || null;
  const hasPlantData = !!plantData;
  const isPlant = rawData?.is_plant ?? false;
  const errorMessage = rawData?.error;
  const isScreenCapture = rawData?.detected_from_screen ?? false;
  const screenMessage = rawData?.screen_message;

  const handleTryAgain = () => {
    navigate('/camera');
  };

  const renderReferenceImages = (images: PlantImage[]) => {
    if (!images || images.length === 0) return null;

    return (
      <div className="mt-6">
        <h4 className="font-medium mb-3 text-gray-700">Reference Images:</h4>
        <div className="grid grid-cols-2 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative">
              <img
                src={image.url}
                alt={image.caption}
                className="w-full h-40 object-cover rounded-lg"
              />
              {image.caption && (
                <p className="text-xs text-gray-600 mt-1">{image.caption}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTaxonomy = (taxonomy: PlantDetails['taxonomy']) => {
    if (!taxonomy) return null;

    return (
      <div className="mt-4 p-4 bg-green-50 rounded-lg">
        <h4 className="font-medium mb-2 text-green-800">Taxonomy:</h4>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-gray-600">Family</p>
            <p className="font-medium text-green-700">{taxonomy.family}</p>
          </div>
          <div>
            <p className="text-gray-600">Genus</p>
            <p className="font-medium text-green-700">{taxonomy.genus}</p>
          </div>
          <div>
            <p className="text-gray-600">Species</p>
            <p className="font-medium text-green-700">{taxonomy.species}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderFlowerDetails = (flowerDetails: PlantDetails['flower_details']) => {
    if (!flowerDetails) return null;

    return (
      <div className="mt-4 p-4 bg-pink-50 rounded-lg">
        <h4 className="font-medium mb-2 text-pink-800">Flower Details:</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-600">Color</p>
            <p className="font-medium text-pink-700">{flowerDetails.color}</p>
          </div>
          <div>
            <p className="text-gray-600">Blooming Season</p>
            <p className="font-medium text-pink-700">{flowerDetails.blooming_season}</p>
          </div>
          {flowerDetails.petal_count && (
            <div>
              <p className="text-gray-600">Petal Count</p>
              <p className="font-medium text-pink-700">{flowerDetails.petal_count}</p>
            </div>
          )}
          {flowerDetails.flower_size && (
            <div>
              <p className="text-gray-600">Flower Size</p>
              <p className="font-medium text-pink-700">{flowerDetails.flower_size}</p>
            </div>
          )}
          {flowerDetails.fragrance && (
            <div>
              <p className="text-gray-600">Fragrance</p>
              <p className="font-medium text-pink-700">{flowerDetails.fragrance}</p>
            </div>
          )}
          {flowerDetails.care_level && (
            <div>
              <p className="text-gray-600">Care Level</p>
              <p className="font-medium text-pink-700">{flowerDetails.care_level}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center bg-gradient-to-r from-green-700 to-green-500 text-white">
        <button 
          onClick={() => navigate('/')}
          className="p-2 rounded-full bg-black/10 text-white mr-4"
          aria-label="Go back"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold flex-grow">Plant Identification</h1>
      </div>
      
      {/* Screen Capture Indicator */}
      {isScreenCapture && (
        <div className="bg-blue-50 p-2 text-center">
          <p className="text-blue-700 text-sm">
            <Info size={16} className="inline-block mr-1" />
            Plant identified from screen image - results may have slightly lower accuracy
          </p>
          {screenMessage && (
            <p className="text-blue-600 text-xs mt-1 italic">{screenMessage}</p>
          )}
        </div>
      )}
      
      {/* Original Image */}
      {imageUrl && (
        <div className="h-48 relative">
          <img 
            src={imageUrl} 
            alt="Captured plant" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
        </div>
      )}
      
      {/* Results Area */}
      <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
        <div className="flex items-center gap-2 mb-4 text-green-700">
          <Leaf size={20} />
          <h2 className="text-lg font-bold">Identification Result</h2>
          {isScreenCapture && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              Screen Capture
            </span>
          )}
        </div>
        
        {/* Error States */}
        {errorMessage ? (
          <div className="text-center p-8 bg-white rounded-lg shadow-md border border-gray-100">
            <Info size={48} className="mx-auto text-red-400 mb-4" />
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            {isScreenCapture && (
              <p className="text-sm text-blue-600 mb-4">
                Tip: For better results, try taking a direct photo of the plant instead of a screen capture.
              </p>
            )}
            <button
              onClick={handleTryAgain}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mx-auto"
            >
              <Camera size={18} />
              Try Again
            </button>
          </div>
        ) : isPlant && classification && classification !== 'No classification received' ? (
          // Main Result Card - Only show if plant was detected
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 mb-4">
            <h3 className="text-xl font-semibold text-green-800">{classification}</h3>
            
            {/* Display details if available */}
            {details && (
              <div className="mt-3 text-gray-700 whitespace-pre-line">
                {details}
              </div>
            )}
            
            {/* Display flower details if available */}
            {hasPlantData && plantData.plant_details?.flower_details && (
              renderFlowerDetails(plantData.plant_details.flower_details)
            )}
            
            {/* Display taxonomy if available */}
            {hasPlantData && plantData.plant_details?.taxonomy && (
              renderTaxonomy(plantData.plant_details.taxonomy)
            )}
            
            {/* Display wiki description if available */}
            {hasPlantData && plantData.plant_details?.wiki_description?.value && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                <h4 className="font-medium mb-2">About this plant:</h4>
                <p>{plantData.plant_details.wiki_description.value}</p>
              </div>
            )}

            {/* Display reference images if available */}
            {hasPlantData && plantData.plant_details?.images && (
              renderReferenceImages(plantData.plant_details.images)
            )}
            
            {/* External search buttons */}
            <div className="mt-5 flex flex-col space-y-2">
              <button 
                onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(classification)}`, '_blank')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Search size={18} />
                Search for more info
              </button>
              
              <button 
                onClick={() => window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(classification.replace(' ', '_'))}`, '_blank')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
              >
                <ExternalLink size={18} />
                View on Wikipedia
              </button>
            </div>
          </div>
        ) : (
          // Backend Connection Error
          <div className="text-center p-8 bg-white rounded-lg shadow-md border border-gray-100">
            <Info size={48} className="mx-auto text-red-400 mb-4" />
            <p className="text-gray-600 mb-6">Could not connect to the plant identification service. Please make sure the backend server is running.</p>
            <button
              onClick={handleTryAgain}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mx-auto"
            >
              <Camera size={18} />
              Try Again
            </button>
          </div>
        )}
        
        {/* Additional suggestions if available */}
        {rawData?.suggestions && rawData.suggestions.length > 1 && (
          <div className="mt-6">
            <h3 className="text-md font-semibold mb-3 text-gray-700">Other possibilities:</h3>
            <div className="space-y-3">
              {rawData.suggestions.slice(1, 4).map((suggestion: PlantSuggestion, index: number) => {
                const probability = (suggestion.probability * 100).toFixed(1);
                const commonName = suggestion.plant_details?.common_names?.[0] || "N/A";
                
                return (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-start">
                      {suggestion.plant_details?.images?.[0] && (
                        <img
                          src={suggestion.plant_details.images[0].url}
                          alt={suggestion.plant_name}
                          className="w-20 h-20 object-cover rounded-lg mr-4"
                        />
                      )}
                      <div className="flex-grow">
                        <h4 className="font-medium text-gray-800">{suggestion.plant_name}</h4>
                        <p className="text-sm text-gray-500">{commonName}</p>
                        <p className="text-sm text-gray-500">Confidence: {probability}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-100">
          <p className="text-sm text-green-800 italic">
            Plant identification is based on image analysis and may not be 100% accurate.
            Consider consulting additional resources for definitive identification.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
