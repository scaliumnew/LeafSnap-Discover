
import React from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HistoryItem {
  id: string;
  plantName: string;
  imageUrl: string;
  date: string;
  isIdentified: boolean;
}

const HistoryScreen = () => {
  const navigate = useNavigate();
  
  // Mock history data
  const historyItems: HistoryItem[] = [
    {
      id: '1',
      plantName: 'Monstera Deliciosa',
      imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.0.3',
      date: 'Today, 2:30 PM',
      isIdentified: true
    },
    {
      id: '2',
      plantName: 'Snake Plant',
      imageUrl: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3',
      date: 'Yesterday, 5:45 PM',
      isIdentified: true
    },
    {
      id: '3',
      plantName: 'Unknown Plant',
      imageUrl: 'https://images.unsplash.com/photo-1617173944583-6c6c8e652c0e?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3',
      date: 'Mar 28, 10:15 AM',
      isIdentified: false
    },
  ];

  const handleItemClick = (item: HistoryItem) => {
    if (item.isIdentified) {
      navigate(`/plant/${item.id}`, {
        state: {
          plant: {
            id: item.id,
            name: item.plantName,
            commonNames: [item.plantName],
            family: 'Plantae',
            imageUrl: item.imageUrl,
            description: 'This is a plant you previously identified.',
            waterNeeds: 'Medium',
            sunlight: 'Partial Shade',
            temperature: '65-85°F (18-29°C)',
            careLevel: 'Easy',
          }
        }
      });
    }
  };

  return (
    <div className="flex flex-col h-screen pb-16">
      {/* Header */}
      <div className="p-4 gradient-primary">
        <h1 className="text-xl font-bold text-white">History</h1>
      </div>
      
      {/* History List */}
      <div className="flex-grow overflow-y-auto p-4 bg-muted">
        {historyItems.length > 0 ? (
          <div className="space-y-4">
            {historyItems.map(item => (
              <div 
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`bg-white p-3 rounded-lg shadow-sm flex items-center ${
                  item.isIdentified ? 'cursor-pointer hover:shadow-md transition-shadow' : 'opacity-70'
                }`}
              >
                <div className="w-16 h-16 rounded overflow-hidden mr-4">
                  <img 
                    src={item.imageUrl} 
                    alt={item.plantName} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-grow">
                  <h3 className="font-medium text-text">{item.plantName}</h3>
                  <div className="flex items-center mt-1">
                    <Calendar size={14} className="text-text-muted mr-1" />
                    <p className="text-xs text-text-muted">{item.date}</p>
                  </div>
                </div>
                {item.isIdentified && <ArrowRight size={18} className="text-text-muted" />}
                {!item.isIdentified && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                    Failed
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8">
            <Calendar size={48} className="mx-auto text-text-muted mb-4" />
            <p className="text-text-muted">No history yet. Start identifying plants!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryScreen;
