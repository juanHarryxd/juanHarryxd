import React, { useEffect, useState } from 'react';
import {
  CubeIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, dashboardService } from '../services/api';

const Dashboard = () => {
  const { state, actions } = useApp();
  const [salesChartData, setSalesChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('week');

  useEffect(() => {
    loadChartData();
    loadTopProducts();
  }, [chartPeriod]);

  const loadChartData = async () => {
    try {
      const response = await dashboardService.getSalesChart({ period: chartPeriod });
      setSalesChartData(response.data.data);
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const loadTopProducts = async () => {
    try {
      const response = await dashboardService.getTopProducts({ period: chartPeriod, limit: 5 });
      setTopProducts(response.data.data);
    } catch (error) {
      console.error('Error loading top products:', error);
    }
  };

  const dashboardData = state.dashboardData;
  const alerts = state.alerts;

  if (!dashboardData) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-32 bg-gray-200"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card h-96 bg-gray-200"></div>
          <div className="card h-96 bg-gray-200"></div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Productos Totales',
      stat: dashboardData.summary.total_products,
      icon: CubeIcon,
      change: '+12%',
      changeType: 'increase',
      color: 'primary',
    },
    {
      name: 'Ventas Hoy',
      stat: dashboardData.summary.today_sales,
      icon: ShoppingCartIcon,
      change: '+2.1%',
      changeType: 'increase',
      color: 'success',
    },
    {
      name: 'Ingresos Hoy',
      stat: formatCurrency(dashboardData.summary.today_revenue),
      icon: CurrencyDollarIcon,
      change: '+4.75%',
      changeType: 'increase',
      color: 'warning',
    },
    {
      name: 'Stock Bajo',
      stat: dashboardData.summary.low_stock_products,
      icon: ExclamationTriangleIcon,
      change: alerts?.counts?.low_stock > 0 ? 'Requiere atención' : 'Todo bien',
      changeType: alerts?.counts?.low_stock > 0 ? 'decrease' : 'increase',
      color: alerts?.counts?.low_stock > 0 ? 'danger' : 'success',
    },
  ];

  const paymentMethodsData = dashboardData.payment_methods?.map((method, index) => ({
    ...method,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Resumen general de tu negocio - {formatDate(new Date())}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item) => (
          <div key={item.name} className="card hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 bg-${item.color}-100 rounded-lg flex items-center justify-center`}>
                  <item.icon className={`w-6 h-6 text-${item.color}-600`} aria-hidden="true" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{item.name}</p>
                <p className="text-2xl font-bold text-gray-900">{item.stat}</p>
                <div className="flex items-center mt-1">
                  {item.changeType === 'increase' ? (
                    <TrendingUpIcon className="w-4 h-4 text-success-500 mr-1" />
                  ) : (
                    <TrendingDownIcon className="w-4 h-4 text-danger-500 mr-1" />
                  )}
                  <span className={`text-sm ${
                    item.changeType === 'increase' ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {item.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Ventas</h3>
              <p className="text-sm text-gray-500">Tendencia de ventas por período</p>
            </div>
            <div className="flex space-x-2">
              {['week', 'month', 'year'].map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    chartPeriod === period
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : 'Año'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (chartPeriod === 'year') return value;
                    return new Date(value).toLocaleDateString('es-ES', { 
                      month: 'short', 
                      day: 'numeric' 
                    });
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'total_revenue' ? formatCurrency(value) : value,
                    name === 'total_revenue' ? 'Ingresos' : 'Ventas'
                  ]}
                  labelFormatter={(label) => formatDate(new Date(label))}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales_count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total_revenue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Métodos de Pago</h3>
              <p className="text-sm text-gray-500">Distribución por método</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="total_amount"
                >
                  {paymentMethodsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {paymentMethodsData.map((method, index) => (
              <div key={method.payment_method} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: method.color }}
                  ></div>
                  <span className="text-sm text-gray-700 capitalize">
                    {method.payment_method}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(method.total_amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Productos Más Vendidos</h3>
              <p className="text-sm text-gray-500">Top 5 productos por ventas</p>
            </div>
          </div>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{product.total_sold} vendidos</p>
                  <p className="text-sm text-gray-500">{formatCurrency(product.total_revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Alertas Recientes</h3>
              <p className="text-sm text-gray-500">Notificaciones importantes</p>
            </div>
          </div>
          <div className="space-y-3">
            {alerts?.low_stock?.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center space-x-3 p-3 bg-warning-50 rounded-lg border border-warning-200">
                <ExclamationTriangleIcon className="w-5 h-5 text-warning-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-warning-800">{product.name}</p>
                  <p className="text-xs text-warning-700">
                    Stock: {product.stock} (Mínimo: {product.min_stock})
                  </p>
                </div>
                <span className="badge-warning">Stock Bajo</span>
              </div>
            ))}
            
            {alerts?.out_of_stock?.slice(0, 3).map((product) => (
              <div key={product.id} className="flex items-center space-x-3 p-3 bg-danger-50 rounded-lg border border-danger-200">
                <ExclamationTriangleIcon className="w-5 h-5 text-danger-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-danger-800">{product.name}</p>
                  <p className="text-xs text-danger-700">Sin stock disponible</p>
                </div>
                <span className="badge-danger">Sin Stock</span>
              </div>
            ))}

            {(!alerts?.low_stock?.length && !alerts?.out_of_stock?.length) && (
              <div className="text-center py-8">
                <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No hay alertas activas</p>
                <p className="text-sm text-gray-400">¡Todo está funcionando bien!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Acciones Rápidas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-primary flex items-center justify-center space-x-2 py-3">
            <ShoppingCartIcon className="w-5 h-5" />
            <span>Nueva Venta</span>
          </button>
          <button className="btn-secondary flex items-center justify-center space-x-2 py-3">
            <CubeIcon className="w-5 h-5" />
            <span>Agregar Producto</span>
          </button>
          <button className="btn-secondary flex items-center justify-center space-x-2 py-3">
            <ChartBarIcon className="w-5 h-5" />
            <span>Ver Reportes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;