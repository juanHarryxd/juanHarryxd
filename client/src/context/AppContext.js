import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { api } from '../services/api';

// Estado inicial
const initialState = {
  // Dashboard data
  dashboardData: null,
  alerts: null,
  
  // Products
  products: [],
  categories: [],
  
  // Sales
  sales: [],
  salesStats: null,
  
  // UI State
  loading: false,
  sidebarOpen: false,
  
  // Cart for new sales
  cart: [],
  
  // Filters and search
  filters: {
    products: {
      search: '',
      category: '',
      lowStock: false
    },
    sales: {
      startDate: '',
      endDate: '',
      paymentMethod: '',
      customerName: ''
    }
  }
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_DASHBOARD_DATA: 'SET_DASHBOARD_DATA',
  SET_ALERTS: 'SET_ALERTS',
  SET_PRODUCTS: 'SET_PRODUCTS',
  SET_CATEGORIES: 'SET_CATEGORIES',
  SET_SALES: 'SET_SALES',
  SET_SALES_STATS: 'SET_SALES_STATS',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  ADD_TO_CART: 'ADD_TO_CART',
  REMOVE_FROM_CART: 'REMOVE_FROM_CART',
  UPDATE_CART_ITEM: 'UPDATE_CART_ITEM',
  CLEAR_CART: 'CLEAR_CART',
  SET_PRODUCT_FILTER: 'SET_PRODUCT_FILTER',
  SET_SALES_FILTER: 'SET_SALES_FILTER',
  RESET_FILTERS: 'RESET_FILTERS'
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
      
    case actionTypes.SET_DASHBOARD_DATA:
      return { ...state, dashboardData: action.payload };
      
    case actionTypes.SET_ALERTS:
      return { ...state, alerts: action.payload };
      
    case actionTypes.SET_PRODUCTS:
      return { ...state, products: action.payload };
      
    case actionTypes.SET_CATEGORIES:
      return { ...state, categories: action.payload };
      
    case actionTypes.SET_SALES:
      return { ...state, sales: action.payload };
      
    case actionTypes.SET_SALES_STATS:
      return { ...state, salesStats: action.payload };
      
    case actionTypes.TOGGLE_SIDEBAR:
      return { ...state, sidebarOpen: !state.sidebarOpen };
      
    case actionTypes.ADD_TO_CART:
      const existingItem = state.cart.find(item => item.product_id === action.payload.product_id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.product_id === action.payload.product_id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
      }
      return { ...state, cart: [...state.cart, action.payload] };
      
    case actionTypes.REMOVE_FROM_CART:
      return {
        ...state,
        cart: state.cart.filter(item => item.product_id !== action.payload)
      };
      
    case actionTypes.UPDATE_CART_ITEM:
      return {
        ...state,
        cart: state.cart.map(item =>
          item.product_id === action.payload.product_id
            ? { ...item, ...action.payload.updates }
            : item
        )
      };
      
    case actionTypes.CLEAR_CART:
      return { ...state, cart: [] };
      
    case actionTypes.SET_PRODUCT_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          products: { ...state.filters.products, ...action.payload }
        }
      };
      
    case actionTypes.SET_SALES_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          sales: { ...state.filters.sales, ...action.payload }
        }
      };
      
    case actionTypes.RESET_FILTERS:
      return {
        ...state,
        filters: initialState.filters
      };
      
    default:
      return state;
  }
}

// Context
const AppContext = createContext();

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Actions
  const actions = {
    setLoading: (loading) => dispatch({ type: actionTypes.SET_LOADING, payload: loading }),
    
    // Dashboard actions
    loadDashboardData: async () => {
      try {
        actions.setLoading(true);
        const response = await api.get('/dashboard/overview');
        dispatch({ type: actionTypes.SET_DASHBOARD_DATA, payload: response.data.data });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        actions.setLoading(false);
      }
    },
    
    loadAlerts: async () => {
      try {
        const response = await api.get('/dashboard/alerts');
        dispatch({ type: actionTypes.SET_ALERTS, payload: response.data.data });
      } catch (error) {
        console.error('Error loading alerts:', error);
      }
    },
    
    // Products actions
    loadProducts: async (filters = {}) => {
      try {
        actions.setLoading(true);
        const params = new URLSearchParams();
        
        if (filters.search) params.append('search', filters.search);
        if (filters.category) params.append('category', filters.category);
        if (filters.lowStock) params.append('low_stock', 'true');
        
        const response = await api.get(`/products?${params.toString()}`);
        dispatch({ type: actionTypes.SET_PRODUCTS, payload: response.data.data });
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        actions.setLoading(false);
      }
    },
    
    loadCategories: async () => {
      try {
        const response = await api.get('/products/categories/list');
        dispatch({ type: actionTypes.SET_CATEGORIES, payload: response.data.data });
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    },
    
    // Sales actions
    loadSales: async (filters = {}) => {
      try {
        actions.setLoading(true);
        const params = new URLSearchParams();
        
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);
        if (filters.paymentMethod) params.append('payment_method', filters.paymentMethod);
        if (filters.customerName) params.append('customer_name', filters.customerName);
        
        const response = await api.get(`/sales?${params.toString()}`);
        dispatch({ type: actionTypes.SET_SALES, payload: response.data.data });
      } catch (error) {
        console.error('Error loading sales:', error);
      } finally {
        actions.setLoading(false);
      }
    },
    
    loadSalesStats: async (period = 'month') => {
      try {
        const response = await api.get(`/sales/stats/summary?period=${period}`);
        dispatch({ type: actionTypes.SET_SALES_STATS, payload: response.data.data });
      } catch (error) {
        console.error('Error loading sales stats:', error);
      }
    },
    
    // UI actions
    toggleSidebar: () => dispatch({ type: actionTypes.TOGGLE_SIDEBAR }),
    
    // Cart actions
    addToCart: (product, quantity = 1) => {
      dispatch({
        type: actionTypes.ADD_TO_CART,
        payload: {
          product_id: product.id,
          name: product.name,
          price: product.price,
          unit_price: product.price,
          quantity,
          stock: product.stock
        }
      });
    },
    
    removeFromCart: (productId) => {
      dispatch({ type: actionTypes.REMOVE_FROM_CART, payload: productId });
    },
    
    updateCartItem: (productId, updates) => {
      dispatch({
        type: actionTypes.UPDATE_CART_ITEM,
        payload: { product_id: productId, updates }
      });
    },
    
    clearCart: () => dispatch({ type: actionTypes.CLEAR_CART }),
    
    // Filter actions
    setProductFilter: (filters) => {
      dispatch({ type: actionTypes.SET_PRODUCT_FILTER, payload: filters });
    },
    
    setSalesFilter: (filters) => {
      dispatch({ type: actionTypes.SET_SALES_FILTER, payload: filters });
    },
    
    resetFilters: () => dispatch({ type: actionTypes.RESET_FILTERS })
  };

  // Load initial data
  useEffect(() => {
    actions.loadDashboardData();
    actions.loadCategories();
    actions.loadProducts();
    actions.loadAlerts();
  }, []);

  const value = {
    state,
    actions,
    actionTypes
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;