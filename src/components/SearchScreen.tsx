
import React, { useState, useEffect } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface PlantSearchResult {
  id: string;
  name: string;
  commonName: string;
  imageUrl: string;
}

const SearchScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlantSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Check if query was passed from home screen
  useEffect(() => {
    if (location.state && location.state.query) {
      setQuery(location.state.query);
      handleSearch(null, location.state.query);
    }
  }, [location.state]);

  const handleSearch = (e: React.FormEvent | null, initialQuery?: string) => {
    if (e) e.preventDefault();
    
    const searchTerm = initialQuery || query;
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    
    // Simulate search delay
    setTimeout(() => {
      // Mock search results
      const searchResults: PlantSearchResult[] = [
        {
          id: '1',
          name: 'Monstera Deliciosa',
          commonName: 'Swiss Cheese Plant',
          imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=1364&auto=format&fit=crop'
        },
        {
          id: '2',
          name: 'Monstera Adansonii',
          commonName: 'Swiss Cheese Vine',
          imageUrl: 'https://images.unsplash.com/photo-1598880940639-93b202203e18?q=80&w=1374&auto=format&fit=crop'
        },
        {
          id: '3',
          name: 'Monstera Obliqua',
          commonName: 'Swiss Cheese Plant',
          imageUrl: 'https://images.unsplash.com/photo-1622548733227-20fdb492379e?q=80&w=1374&auto=format&fit=crop'
        },
      ];
      
      setResults(searchResults);
      setIsSearching(false);
    }, 800);
  };

  const handlePlantSelect = (plant: PlantSearchResult) => {
    navigate(`/plant/${plant.id}`, {
      state: {
        plant: {
          ...plant,
          commonNames: [plant.commonName],
          family: 'Araceae',
          description: 'This is a beautiful tropical plant native to rainforests.',
          waterNeeds: 'Medium',
          sunlight: 'Partial Shade',
          temperature: '65-85°F (18-29°C)',
          careLevel: 'Easy',
        }
      }
    });
  };

  return (
    <div className="flex flex-col h-screen pt-0 pb-16">
      {/* Search bar moved to header component */}
      <div className="px-4 -mt-3 mb-3">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Search plants by name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full py-2 px-4 pl-10 bg-white text-text outline-none shadow-md"
            aria-label="Search plants"
          />
          <button 
            type="submit" 
            className="absolute left-0 top-0 h-full flex items-center justify-center w-10 text-text-muted"
          >
            <Search size={18} />
          </button>
        </form>
      </div>
      
      {/* Results */}
      <div className="flex-grow overflow-y-auto p-4 bg-muted">
        {isSearching ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {query && (
              <h2 className="text-sm font-medium text-text-muted mb-3">
                {results.length ? `Results for "${query}"` : `No results for "${query}"`}
              </h2>
            )}
            
            <div className="space-y-3">
              {results.map(plant => (
                <div 
                  key={plant.id}
                  className="bg-white p-3 rounded-lg shadow-sm flex items-center cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handlePlantSelect(plant)}
                >
                  <div className="w-16 h-16 rounded overflow-hidden mr-4">
                    <img 
                      src={plant.imageUrl} 
                      alt={plant.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-medium text-text">{plant.name}</h3>
                    <p className="text-sm text-text-muted">{plant.commonName}</p>
                  </div>
                  <ArrowRight size={18} className="text-text-muted" />
                </div>
              ))}
              
              {query && !isSearching && !results.length && (
                <div className="text-center p-8">
                  <p className="text-text-muted">No plants found. Try another search.</p>
                </div>
              )}
              
              {!query && !isSearching && (
                <div className="text-center p-8">
                  <p className="text-text-muted">Enter a plant name to search</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchScreen;
