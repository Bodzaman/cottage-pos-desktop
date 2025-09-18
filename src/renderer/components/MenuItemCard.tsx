import React from 'react';
import { formatters } from '../utils/formatters';
import type { MenuItem } from '../utils/api-client';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToOrder?: (item: MenuItem) => void;
  onEdit?: (item: MenuItem) => void;
  showControls?: boolean;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onAddToOrder,
  onEdit,
  showControls = true
}) => {
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '16px',
    margin: '8px',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    cursor: showControls ? 'pointer' : 'default',
    opacity: item.available ? 1 : 0.6
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 12px',
    margin: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s'
  };

  const editButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#FF9800'
  };

  const unavailableStyle: React.CSSProperties = {
    ...cardStyle,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    border: '1px solid rgba(255, 0, 0, 0.3)'
  };

  return (
    <div style={item.available ? cardStyle : unavailableStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '18px',
            color: item.available ? 'white' : '#ffcdd2'
          }}>
            {item.name}
          </h3>

          {item.description && (
            <p style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              opacity: 0.8,
              lineHeight: '1.4'
            }}>
              {item.description}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              fontSize: '20px', 
              fontWeight: 'bold',
              color: '#4CAF50'
            }}>
              {formatters.currency(item.price)}
            </span>

            <span style={{
              fontSize: '12px',
              backgroundColor: item.available ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
              color: item.available ? '#4CAF50' : '#f44336',
              padding: '4px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              fontWeight: 'bold'
            }}>
              {item.available ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>

        {showControls && item.available && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {onAddToOrder && (
              <button
                style={buttonStyle}
                onClick={() => onAddToOrder(item)}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
              >
                Add to Order
              </button>
            )}

            {onEdit && (
              <button
                style={editButtonStyle}
                onClick={() => onEdit(item)}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F57C00'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FF9800'}
              >
                Edit Item
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{
        marginTop: '8px',
        fontSize: '12px',
        opacity: 0.6
      }}>
        Category: {item.category} | ID: {item.id}
      </div>
    </div>
  );
};

export default MenuItemCard;
