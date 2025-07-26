import React, { useEffect, useState } from 'react';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  TrashIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, salesService, handleSuccess } from '../services/api';

const Sales = () => {
  const { state, actions } = useApp();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentMethod: '',
    customerName: ''
  });

  useEffect(() => {
    actions.loadSales(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCancelSale = async (sale) => {
    if (window.confirm(`¿Estás seguro de que quieres anular la venta #${sale.id}?`)) {
      try {
        await salesService.cancel(sale.id, 'Anulación solicitada por usuario');
        handleSuccess('Venta anulada exitosamente');
        actions.loadSales(filters);
      } catch (error) {
        console.error('Error canceling sale:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
        <p className="mt-2 text-gray-600">
          Historial y gestión de todas las ventas
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Fecha Inicio</label>
            <input
              type="date"
              className="input"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Fecha Fin</label>
            <input
              type="date"
              className="input"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Método de Pago</label>
            <select
              className="input"
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>
          <div>
            <label className="label">Cliente</label>
            <input
              type="text"
              placeholder="Buscar por cliente..."
              className="input"
              value={filters.customerName}
              onChange={(e) => handleFilterChange('customerName', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card p-0 overflow-hidden">
        {state.loading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="bg-gray-50">
                  <th className="table-header">ID</th>
                  <th className="table-header">Fecha</th>
                  <th className="table-header">Cliente</th>
                  <th className="table-header">Total</th>
                  <th className="table-header">Método</th>
                  <th className="table-header">Productos</th>
                  <th className="table-header">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {state.sales.map((sale) => (
                  <tr key={sale.id} className="table-row">
                    <td className="table-cell">
                      <span className="font-mono text-sm">#{sale.id}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                        {formatDate(sale.created_at)}
                      </div>
                    </td>
                    <td className="table-cell">
                      {sale.customer_name || (
                        <span className="text-gray-400">Sin especificar</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className="font-bold text-success-600">
                        {formatCurrency(sale.total)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="badge-primary capitalize">
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-gray-600">
                        {sale.items_count} productos
                      </span>
                      {sale.products_summary && (
                        <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                          {sale.products_summary}
                        </div>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                          title="Ver detalles"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancelSale(sale)}
                          className="p-1 text-gray-400 hover:text-danger-600 transition-colors"
                          title="Anular venta"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {state.sales.length === 0 && !state.loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron ventas
                </h3>
                <p className="text-gray-500">
                  No hay ventas que coincidan con los filtros seleccionados
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sales;