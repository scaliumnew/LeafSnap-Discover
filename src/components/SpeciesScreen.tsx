import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// Mock species data with updated image URLs
const speciesList = [
  {
    id: '1',
    name: 'Monstera Deliciosa',
    family: 'Araceae',
    commonName: 'Swiss Cheese Plant',
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '2',
    name: 'Sansevieria Trifasciata',
    family: 'Asparagaceae',
    commonName: 'Snake Plant',
    imageUrl: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '3',
    name: 'Ficus Lyrata',
    family: 'Moraceae',
    commonName: 'Fiddle Leaf Fig',
    imageUrl: 'https://images.unsplash.com/photo-1616602416236-31d2f9e0a5d1?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '4',
    name: 'Chlorophytum Comosum',
    family: 'Asparagaceae',
    commonName: 'Spider Plant',
    imageUrl: 'https://images.unsplash.com/photo-1637967565444-39fa24ee0107?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '5',
    name: 'Epipremnum Aureum',
    family: 'Araceae',
    commonName: 'Pothos',
    imageUrl: 'https://images.unsplash.com/photo-1622557850300-f197eb10ffb2?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '6',
    name: 'Spathiphyllum Wallisii',
    family: 'Araceae',
    commonName: 'Peace Lily',
    imageUrl: 'https://images.unsplash.com/photo-1620127252536-03bdfcb67c56?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '7',
    name: 'Calathea Orbifolia',
    family: 'Marantaceae',
    commonName: 'Prayer Plant',
    imageUrl: 'https://images.unsplash.com/photo-1602923668104-8f9e03e77e62?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '8',
    name: 'Crassula Ovata',
    family: 'Crassulaceae',
    commonName: 'Jade Plant',
    imageUrl: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?q=80&w=1375&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '9',
    name: 'Dracaena Marginata',
    family: 'Asparagaceae',
    commonName: 'Dragon Tree',
    imageUrl: 'https://images.unsplash.com/photo-1613737693060-1a27ae638eea?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '10',
    name: 'Pilea Peperomioides',
    family: 'Urticaceae',
    commonName: 'Chinese Money Plant',
    imageUrl: 'https://images.unsplash.com/photo-1614594604569-aee82a836218?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '11',
    name: 'Aloe Vera',
    family: 'Asphodelaceae',
    commonName: 'Aloe Vera',
    imageUrl: 'https://images.unsplash.com/photo-1519259343747-92004a99969a?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '12',
    name: 'Zamioculcas Zamiifolia',
    family: 'Araceae',
    commonName: 'ZZ Plant',
    imageUrl: 'https://images.unsplash.com/photo-1632494053982-efc957415c52?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '13',
    name: 'Monstera Adansonii',
    family: 'Araceae',
    commonName: 'Swiss Cheese Vine',
    imageUrl: 'https://images.unsplash.com/photo-1598880940639-93b202203e18?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '14',
    name: 'Aglaonema',
    family: 'Araceae',
    commonName: 'Chinese Evergreen',
    imageUrl: 'https://images.unsplash.com/photo-1632494114909-b94e9a7b8e91?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '15',
    name: 'Hoya Carnosa',
    family: 'Apocynaceae',
    commonName: 'Wax Plant',
    imageUrl: 'https://images.unsplash.com/photo-1622557693053-b9515199559f?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '16',
    name: 'Fittonia Albivenis',
    family: 'Acanthaceae',
    commonName: 'Nerve Plant',
    imageUrl: 'https://images.unsplash.com/photo-1632494109813-494a58199c8e?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '17',
    name: 'Peperomia Obtusifolia',
    family: 'Piperaceae',
    commonName: 'Baby Rubber Plant',
    imageUrl: 'https://images.unsplash.com/photo-1587316255142-ca90970ca5ee?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '18',
    name: 'Nephrolepis Exaltata',
    family: 'Nephrolepidaceae',
    commonName: 'Boston Fern',
    imageUrl: 'https://images.unsplash.com/photo-1587316254981-98b59b4493e8?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '19',
    name: 'Beaucarnea Recurvata',
    family: 'Asparagaceae',
    commonName: 'Ponytail Palm',
    imageUrl: 'https://images.unsplash.com/photo-1632494089837-34ca44a4529a?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '20',
    name: 'Euphorbia Trigona',
    family: 'Euphorbiaceae',
    commonName: 'African Milk Tree',
    imageUrl: 'https://images.unsplash.com/photo-1622557718429-d17c14b0556f?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
];

const SpeciesScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-4">Plant Species</h1>
      
      <div className="flex flex-col">
        {speciesList.map((species) => (
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
              <p className="text-sm text-text-muted truncate">({species.commonName})</p>
            </div>
            <ChevronRight size={20} className="text-text-muted flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpeciesScreen;
