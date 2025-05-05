
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Mock species data with updated image URLs
const speciesList = [
  {
    id: '1',
    name: 'Monstera Deliciosa',
    family: 'Araceae',
    commonName: 'Swiss Cheese Plant',
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.0.3',
    careLevel: 'Easy',
  },
  {
    id: '2',
    name: 'Sansevieria Trifasciata',
    family: 'Asparagaceae',
    commonName: 'Snake Plant',
    imageUrl: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3',
    careLevel: 'Easy',
  },
  {
    id: '3',
    name: 'Ficus Lyrata',
    family: 'Moraceae',
    commonName: 'Fiddle Leaf Fig',
    imageUrl: 'https://images.unsplash.com/photo-1616602416236-31d2f9e0a5d1?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.0.3',
    careLevel: 'Moderate',
  },
  {
    id: '4',
    name: 'Chlorophytum Comosum',
    family: 'Asparagaceae',
    commonName: 'Spider Plant',
    imageUrl: 'https://images.unsplash.com/photo-1637967565444-39fa24ee0107?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3',
    careLevel: 'Easy',
  },
  {
    id: '5',
    name: 'Epipremnum Aureum',
    family: 'Araceae',
    commonName: 'Pothos',
    imageUrl: 'https://images.unsplash.com/photo-1622557850300-f197eb10ffb2?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3',
    careLevel: 'Easy',
  },
  {
    id: '6',
    name: 'Spathiphyllum Wallisii',
    family: 'Araceae',
    commonName: 'Peace Lily',
    imageUrl: 'https://images.unsplash.com/photo-1620127252536-03bdfcb67c56?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3',
    careLevel: 'Easy',
  },
  {
    id: '7',
    name: 'Calathea Orbifolia',
    family: 'Marantaceae',
    commonName: 'Prayer Plant',
    imageUrl: 'https://images.unsplash.com/photo-1602923668104-8f9e03e77e62?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3',
    careLevel: 'Difficult',
  },
  {
    id: '8',
    name: 'Crassula Ovata',
    family: 'Crassulaceae',
    commonName: 'Jade Plant',
    imageUrl: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?q=80&w=1375&auto=format&fit=crop&ixlib=rb-4.0.3',
    careLevel: 'Easy',
  },
  {
    id: '9',
    name: 'Dracaena Marginata',
    family: 'Asparagaceae',
    commonName: 'Dragon Tree',
    imageUrl: 'https://images.unsplash.com/photo-1613737693060-1a27ae638eea?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3',
    careLevel: 'Easy',
  },
  {
    id: '10',
    name: 'Pilea Peperomioides',
    family: 'Urticaceae',
    commonName: 'Chinese Money Plant',
    imageUrl: 'https://images.unsplash.com/photo-1614594604569-aee82a836218?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3',
    careLevel: 'Moderate',
  },
];

const SpeciesScreen = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = speciesList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(speciesList.length / itemsPerPage);
  
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  // Get care level badge style
  const getCareLevelBadge = (level: string) => {
    switch (level) {
      case 'Easy':
        return 'bg-green-100 text-green-800';
      case 'Moderate':
        return 'bg-amber-100 text-amber-800';
      case 'Difficult':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-4">Plant Species</h1>
      
      <div className="flex flex-col">
        {currentItems.map((species) => (
          <div 
            key={species.id}
            className="flex items-center mb-4 bg-white rounded-lg p-4 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),_0px_4px_6px_-2px_rgba(0,0,0,0.05)] cursor-pointer"
            onClick={() => navigate(`/species/${species.id}`)}
          >
            <div className="w-16 h-16 rounded-lg overflow-hidden mr-4 flex-shrink-0">
              <img 
                src={species.imageUrl} 
                alt={species.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text truncate">{species.name}</h3>
              <p className="text-sm text-text-muted truncate">{species.commonName}</p>
              <div className="flex items-center mt-1 flex-wrap gap-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${getCareLevelBadge(species.careLevel)}`}>
                  {species.careLevel}
                </span>
                <span className="text-xs text-text-muted">Family: {species.family}</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-text-muted flex-shrink-0" />
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
                </PaginationItem>
              )}
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={page === currentPage}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default SpeciesScreen;
