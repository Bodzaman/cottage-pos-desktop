import React from 'react';
import { formatters } from './utils/formatters';

const App: React.FC = () => {
  // Test the formatter integration
  const testAmount = 15.99;
  const testDate = new Date();
  const testPhone = '07123456789';
  const testOrderNum = 42;

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1>🏪 Cottage Tandoori POS Desktop</h1>
      <p>✅ Step 3a Complete: First component integration successful!</p>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: '8px'
      }}>
        <h3>🎯 Integration Status:</h3>
        <ul>
          <li>✅ Clean Electron baseline established</li>
          <li>✅ React dependencies added</li>
          <li>✅ Basic React renderer working</li>
          <li>✅ First utility component integrated</li>
          <li>🔄 Ready for next component addition</li>
        </ul>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: '8px'
      }}>
        <h3>🧪 Formatters Test:</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>💰 Currency: {formatters.currency(testAmount)}</li>
          <li>🕐 Time: {formatters.time(testDate)}</li>
          <li>📅 Date: {formatters.date(testDate)}</li>
          <li>📞 Phone: {formatters.phone(testPhone)}</li>
          <li>🧾 Order: {formatters.orderNumber(testOrderNum)}</li>
          <li>🪑 Table: {formatters.tableNumber(5)}</li>
        </ul>
      </div>

      <div style={{
        marginTop: '20px',
        fontSize: '14px',
        opacity: 0.8
      }}>
        Ready for next POSDesktop component integration...
      </div>
    </div>
  );
};

export default App;
