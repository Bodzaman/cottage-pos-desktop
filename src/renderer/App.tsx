import React from 'react';
import { formatters } from './utils/formatters';
import { MenuItemCard } from './components/MenuItemCard';
import type { MenuItem } from './utils/api-client';

const App: React.FC = () => {
  // Test data for MenuItemCard
  const sampleMenuItems: MenuItem[] = [
    {
      id: '1',
      name: 'Chicken Tikka Masala',
      price: 12.95,
      category: 'Main Courses',
      description: 'Tender chicken pieces in a rich, creamy tomato sauce with aromatic spices',
      available: true
    },
    {
      id: '2', 
      name: 'Lamb Biryani',
      price: 15.50,
      category: 'Rice Dishes',
      description: 'Fragrant basmati rice layered with spiced lamb and garnished with fried onions',
      available: true
    },
    {
      id: '3',
      name: 'Vegetable Samosa',
      price: 4.95,
      category: 'Starters',
      description: 'Crispy pastry filled with spiced potatoes and peas',
      available: false
    }
  ];

  const handleAddToOrder = (item: MenuItem) => {
    console.log('Adding to order:', item.name);
    // This would integrate with order management
  };

  const handleEditItem = (item: MenuItem) => {
    console.log('Editing item:', item.name);
    // This would open edit modal
  };

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1>🏪 Cottage Tandoori POS Desktop</h1>
      <p>✅ Step 3d Complete: Core UI component integration successful!</p>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: '8px'
      }}>
        <h3>🎯 Integration Progress:</h3>
        <ul>
          <li>✅ Clean Electron baseline established</li>
          <li>✅ React dependencies added</li>
          <li>✅ Basic React renderer working</li>
          <li>✅ Formatters utility integrated</li>
          <li>✅ API client for brain.* replacement</li>
          <li>✅ Core UI component (MenuItemCard)</li>
          <li>🔄 Ready for complex components</li>
        </ul>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: '8px'
      }}>
        <h3>🧪 Component Tests:</h3>
        <div style={{ fontSize: '14px', marginBottom: '10px' }}>
          💰 Currency: {formatters.currency(15.99)} | 
          📞 Phone: {formatters.phone('07123456789')} | 
          🧾 Order: {formatters.orderNumber(42)}
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>🍽️ Menu Item Cards Test:</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '10px',
          marginTop: '15px'
        }}>
          {sampleMenuItems.map(item => (
            <MenuItemCard
              key={item.id}
              item={item}
              onAddToOrder={handleAddToOrder}
              onEdit={handleEditItem}
              showControls={true}
            />
          ))}
        </div>
      </div>

      <div style={{
        marginTop: '20px',
        fontSize: '14px',
        opacity: 0.8
      }}>
        Ready for POSDesktop main component integration...
      </div>
    </div>
  );
};

export default App;
