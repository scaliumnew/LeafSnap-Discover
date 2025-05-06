import React, { useState, useRef } from 'react'; // Import useRef
import { useNavigate } from 'react-router-dom';
import { Camera, Image, Leaf, Book, Search, ChevronRight } from 'lucide-react';
import AppLogo from './AppLogo';
import FloatingActionButton from './FloatingActionButton';
import OptionBottomSheet from './OptionBottomSheet';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from '@/lib/utils';

// Plant types data
const plantTypes = [{
  id: '1',
  title: 'Home Plants',
  count: '68 Types of Plants',
  image: 'https://images.unsplash.com/photo-1463320898484-cdee8141c787?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3'
}, {
  id: '2',
  title: 'Succulents',
  count: '42 Types of Plants',
  image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3'
}, {
  id: '3',
  title: 'Flowering',
  count: '56 Types of Plants',
  image: 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3'
}, {
  id: '4',
  title: 'Herbs',
  count: '32 Types of Plants',
  image: 'https://images.unsplash.com/photo-1466945924683-06a85d882d5e?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3'
}, {
  id: '5',
  title: 'Trees',
  count: '102 Types of Plants',
  image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3'
}];
const HomeScreen = () => {
  const navigate = useNavigate();
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null); // Add ref for file input
  const handleCameraSelect = () => {
    navigate('/camera');
  };
  const handleGallerySelect = () => {
    // Trigger the hidden file input
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        navigate('/confirm-image', {
          state: {
            imageSource: 'gallery',
            imageUrl: reader.result as string // Pass the selected image data URL
          }
        });
      };
      reader.readAsDataURL(file);
      // Reset the input value to allow selecting the same file again
      event.target.value = ''; 
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/search', {
        state: {
          query: searchQuery
        }
      });
    }
  };
  return <div className="relative h-screen">
      {/* Hidden File Input for Gallery Selection */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />

      {/* Search Bar */}
      <div className="px-4 -mt-3 mb-3">
        <form onSubmit={handleSearch} className="relative">
          <input type="text" placeholder="Search plants..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full rounded-full py-2 px-4 pl-10 bg-white text-text outline-none shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),_0px_4px_6px_-2px_rgba(0,0,0,0.05)]" aria-label="Search plants" />
          <button type="submit" className="absolute left-0 top-0 h-full flex items-center justify-center w-10 text-text-muted">
            <Search size={18} />
          </button>
        </form>
      </div>
      
      {/* Main Content */}
      <div className="p-6 -mt-3 overflow-y-auto pb-20">
        <div className="bg-white rounded-xl shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),_0px_4px_6px_-2px_rgba(0,0,0,0.05)] p-6 text-center">
          <h2 className="text-lg font-bold text-text mb-2">Identify Plants</h2>
          <p className="text-sm text-text-muted mb-6">
            Take a photo or choose from your gallery to identify plants instantly
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button onClick={() => navigate('/camera')} className="p-6 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-text flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <span className="font-medium text-sm">Take Photo</span>
            </button>
            
            <button onClick={handleGallerySelect} className="p-6 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-text flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Image className="h-6 w-6 text-primary" />
              </div>
              <span className="font-medium text-sm">Gallery</span>
            </button>
          </div>
        </div>
        
        {/* Browse by Section */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-text mb-3">Browse by</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-white p-6 rounded-lg shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),_0px_4px_6px_-2px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow flex flex-col items-center" onClick={() => navigate('/species')}>
              <Leaf className="h-8 w-8 text-primary mb-2" />
              <span className="font-medium text-gray-500">SPECIES</span>
            </button>
            
            <button onClick={() => navigate('/articles')} className="bg-white p-6 rounded-lg shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),_0px_4px_6px_-2px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow flex flex-col items-center">
              <Book className="h-8 w-8 text-primary mb-2" />
              <span className="font-medium text-gray-500">ARTICLES</span>
            </button>
          </div>
        </div>

        {/* Plant Types Section with Carousel */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-text">Plant Types</h2>
            <button onClick={() => navigate('/plant-types')} className="flex items-center text-sm font-medium text-primary">
              View all
              <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
          
          <Carousel opts={{
          align: "start",
          loop: true
        }} className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {plantTypes.map(type => <CarouselItem key={type.id} className="pl-2 md:pl-4 basis-4/5 md:basis-1/2 lg:basis-1/3">
                  <div className="h-48 relative rounded-lg overflow-hidden cursor-pointer" onClick={() => navigate(`/plant-types/${type.id}`)}>
                    <div className="absolute inset-0 w-full h-full">
                      <img src={type.image} alt={type.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4 text-white">
                      <h3 className="text-xl font-bold">{type.title}</h3>
                      <p className="text-sm opacity-90">{type.count}</p>
                    </div>
                  </div>
                </CarouselItem>)}
            </CarouselContent>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
          </Carousel>
        </div>
        
        {/* Recent Discoveries Section */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-text mb-3">Recent Discoveries</h2>
          
          {/* Mock data for recent discoveries */}
          <div className="grid grid-cols-2 gap-3">
            {[{
            id: '1',
            name: 'Monstera',
            image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.0.3'
          }, {
            id: '2',
            name: 'Snake Plant',
            image: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3'
          }].map(plant => <div key={plant.id} onClick={() => navigate(`/plant/${plant.id}`)} className="bg-white rounded-lg overflow-hidden shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),_0px_4px_6px_-2px_rgba(0,0,0,0.05)] cursor-pointer hover:shadow-md transition-shadow">
                <div className="h-32 relative">
                  <img src={plant.image} alt={plant.name} className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="p-2">
                  <h3 className="font-medium text-sm text-text">{plant.name}</h3>
                </div>
              </div>)}
          </div>
        </div>
      </div>
      
      <FloatingActionButton onClick={() => setIsBottomSheetOpen(true)} />
      
      <OptionBottomSheet isOpen={isBottomSheetOpen} onClose={() => setIsBottomSheetOpen(false)} onCameraSelect={handleCameraSelect} onGallerySelect={handleGallerySelect} />
    </div>;
};
export default HomeScreen;
