import axios from 'axios';
import toast from 'react-hot-toast';

// Configuración base de axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    // Agregar token de autenticación si existe
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejo global de errores
    if (error.response) {
      // Error del servidor
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          toast.error(data.error || 'Datos inválidos');
          break;
        case 401:
          toast.error('No autorizado');
          // Redirect to login if needed
          break;
        case 403:
          toast.error('Acceso denegado');
          break;
        case 404:
          toast.error('Recurso no encontrado');
          break;
        case 500:
          toast.error('Error interno del servidor');
          break;
        default:
          toast.error(data.error || 'Error desconocido');
      }
    } else if (error.request) {
      // Error de red
      toast.error('Error de conexión. Verifica tu conexión a internet.');
    } else {
      // Error de configuración
      toast.error('Error en la configuración de la petición');
    }
    
    return Promise.reject(error);
  }
);

// Servicios específicos
const productService = {
  // Obtener todos los productos
  getAll: (params = {}) => api.get('/products', { params }),
  
  // Obtener un producto por ID
  getById: (id) => api.get(`/products/${id}`),
  
  // Crear nuevo producto
  create: (productData) => api.post('/products', productData),
  
  // Actualizar producto
  update: (id, productData) => api.put(`/products/${id}`, productData),
  
  // Eliminar producto
  delete: (id) => api.delete(`/products/${id}`),
  
  // Ajustar stock
  adjustStock: (id, adjustment) => api.post(`/products/${id}/adjust-stock`, adjustment),
  
  // Obtener categorías
  getCategories: () => api.get('/products/categories/list'),
};

const salesService = {
  // Obtener todas las ventas
  getAll: (params = {}) => api.get('/sales', { params }),
  
  // Obtener una venta por ID
  getById: (id) => api.get(`/sales/${id}`),
  
  // Crear nueva venta
  create: (saleData) => api.post('/sales', saleData),
  
  // Anular venta
  cancel: (id, reason) => api.delete(`/sales/${id}`, { data: { reason } }),
  
  // Obtener estadísticas
  getStats: (period = 'month') => api.get(`/sales/stats/summary?period=${period}`),
  
  // Obtener ventas diarias
  getDailyStats: (days = 30) => api.get(`/sales/stats/daily?days=${days}`),
};

const dashboardService = {
  // Obtener overview del dashboard
  getOverview: () => api.get('/dashboard/overview'),
  
  // Obtener alertas
  getAlerts: () => api.get('/dashboard/alerts'),
  
  // Obtener datos para gráficos de ventas
  getSalesChart: (params = {}) => api.get('/dashboard/sales-chart', { params }),
  
  // Obtener productos más vendidos
  getTopProducts: (params = {}) => api.get('/dashboard/top-products', { params }),
  
  // Obtener resumen de inventario
  getInventorySummary: () => api.get('/dashboard/inventory-summary'),
};

// Utilidades para formateo de datos
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (date) => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

const formatDateShort = (date) => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
};

// Validaciones comunes
const validators = {
  email: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },
  
  phone: (phone) => {
    const regex = /^[+]?[\d\s\-()]{9,}$/;
    return regex.test(phone);
  },
  
  price: (price) => {
    return !isNaN(price) && parseFloat(price) >= 0;
  },
  
  stock: (stock) => {
    return !isNaN(stock) && parseInt(stock) >= 0;
  },
  
  required: (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  },
};

// Helper para manejar errores de formularios
const handleFormError = (error) => {
  if (error.response?.data?.details) {
    // Si hay detalles específicos de validación
    return error.response.data.details;
  } else if (error.response?.data?.error) {
    // Error general
    return [error.response.data.error];
  } else {
    // Error genérico
    return ['Error desconocido al procesar la solicitud'];
  }
};

// Helper para manejar respuestas exitosas
const handleSuccess = (message, duration = 3000) => {
  toast.success(message, { duration });
};

// Helper para manejar loading states
const withLoading = async (asyncFunction, loadingMessage = 'Cargando...') => {
  const loadingToast = toast.loading(loadingMessage);
  
  try {
    const result = await asyncFunction();
    toast.dismiss(loadingToast);
    return result;
  } catch (error) {
    toast.dismiss(loadingToast);
    throw error;
  }
};

export {
  api,
  productService,
  salesService,
  dashboardService,
  formatCurrency,
  formatDate,
  formatDateShort,
  validators,
  handleFormError,
  handleSuccess,
  withLoading,
};