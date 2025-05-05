
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import AppLogo from './AppLogo';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const isSpecies = location.pathname === '/species';
  const isArticles = location.pathname === '/articles';
  
  // Skip header on certain routes
  const hideHeaderOnRoutes = [
    '/camera',
    '/confirm-image',
    '/processing',
  ];
  
  if (hideHeaderOnRoutes.includes(location.pathname)) {
    return null;
  }
  
  return (
    <div className="gradient-primary p-4 pt-8 pb-6">
      <div className="flex items-center">
        {!isHome && (
          <button
            onClick={() => navigate(-1)}
            className="mr-3 p-2 rounded-full bg-white/20"
            aria-label="Go back"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
        )}
        
        {isHome || isSpecies || isArticles ? (
          <>
            <AppLogo size="small" className="mr-3" />
            <div>
              <h1 className="text-xl font-bold text-white">Leaf Snap</h1>
              <p className="text-xs text-white/80">
                {isHome && "Discover Plants with a Snap"}
                {isSpecies && "Explore our plant collection"}
                {isArticles && "Tips, guides, and plant care"}
              </p>
            </div>
          </>
        ) : (
          <h1 className="text-xl font-bold text-white">
            {location.pathname.includes('/search') && 'Search'}
            {location.pathname.includes('/history') && 'History'}
            {location.pathname.includes('/help') && 'Help'}
            {location.pathname.includes('/plant/') && 'Plant Details'}
            {location.pathname.includes('/results') && 'Identification Results'}
            {location.pathname.includes('/species/') && 'Species Details'}
          </h1>
        )}
      </div>
    </div>
  );
};

export default Header;
