import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  DocumentChartBarIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatCurrency, dashboardService } from '../services/api';

const Reports = () => {
  const { state } = useApp();
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    loadReportsData();
  }, [period]);

  const loadReportsData = async () => {
    try {
      const [salesResponse, productsResponse] = await Promise.all([
        dashboardService.getSalesChart({ period }),
        dashboardService.getTopProducts({ period, limit: 10 })
      ]);
      
      setSalesData(salesResponse.data.data);
      setTopProducts(productsResponse.data.data);
    } catch (error) {
      console.error('Error loading reports data:', error);
    }
  };

  const totalRevenue = salesData.reduce((sum, item) => sum + item.total_revenue, 0);
  const totalSales = salesData.reduce((sum, item) => sum + item.sales_count, 0);
  const avgSale = totalSales > 0 ? totalRevenue / totalSales : 0;

  const categoryData = state.categories.map((cat, index) => ({
    ...cat,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="mt-2 text-gray-600">
            Análisis y estadísticas del negocio
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <select
            className="input"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="week">Última Semana</option>
            <option value="month">Último Mes</option>
            <option value="year">Último Año</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <CurrencyDollarIcon className="w-12 h-12 text-success-600 mx-auto mb-3" />
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-sm text-gray-600">Ingresos Totales</div>
        </div>
        
        <div className="card text-center">
          <ChartBarIcon className="w-12 h-12 text-primary-600 mx-auto mb-3" />
          <div className="text-2xl font-bold text-gray-900">
            {totalSales}
          </div>
          <div className="text-sm text-gray-600">Ventas Totales</div>
        </div>
        
        <div className="card text-center">
          <TrendingUpIcon className="w-12 h-12 text-warning-600 mx-auto mb-3" />
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(avgSale)}
          </div>
          <div className="text-sm text-gray-600">Promedio por Venta</div>
        </div>
        
        <div className="card text-center">
          <DocumentChartBarIcon className="w-12 h-12 text-danger-600 mx-auto mb-3" />
          <div className="text-2xl font-bold text-gray-900">
            {state.products.length}
          </div>
          <div className="text-sm text-gray-600">Productos Activos</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">
              Tendencia de Ventas
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (period === 'year') return value;
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
                />
                <Line 
                  type="monotone" 
                  dataKey="total_revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Products by Category */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">
              Productos por Categoría
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="product_count"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {categoryData.map((category) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-sm text-gray-700">
                    {category.category}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {category.product_count} productos
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-medium text-gray-900">
            Productos Más Vendidos
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header">Ranking</th>
                <th className="table-header">Producto</th>
                <th className="table-header">Categoría</th>
                <th className="table-header">Cantidad Vendida</th>
                <th className="table-header">Ingresos</th>
                <th className="table-header">Margen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topProducts.map((product, index) => (
                <tr key={product.id} className="table-row">
                  <td className="table-cell">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-600">
                        #{index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(product.price)} c/u
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="badge-gray">{product.category}</span>
                  </td>
                  <td className="table-cell font-medium">
                    {product.total_sold}
                  </td>
                  <td className="table-cell font-medium text-success-600">
                    {formatCurrency(product.total_revenue)}
                  </td>
                  <td className="table-cell">
                    <span className="text-sm font-medium text-success-600">
                      {product.profit_margin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;