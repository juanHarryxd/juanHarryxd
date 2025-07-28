import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout
import Layout from './components/Layout/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import NewSale from './pages/NewSale';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';

// Context
import { AppProvider } from './context/AppContext';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="App">
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/sales/new" element={<NewSale />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </Layout>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            containerClassName=""
            containerStyle={{}}
            toastOptions={{
              // Define default options
              className: '',
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '14px',
                padding: '12px 16px',
              },
              // Default options for specific types
              success: {
                duration: 3000,
                style: {
                  background: '#10b981',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#10b981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#ef4444',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#ef4444',
                },
              },
              loading: {
                style: {
                  background: '#3b82f6',
                },
              },
            }}
          />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;