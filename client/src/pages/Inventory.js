import React from 'react';
import { 
  CubeIcon, 
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon 
} from '@heroicons/react/24/outline';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../services/api';

const Inventory = () => {
  const { state } = useApp();

  const lowStockProducts = state.products.filter(product => product.low_stock);
  const outOfStockProducts = state.products.filter(product => product.stock === 0);
  const totalInventoryValue = state.products.reduce(
    (total, product) => total + (product.stock * product.price), 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
        <p className="mt-2 text-gray-600">
          Control y gestión del stock de productos
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <CubeIcon className="w-12 h-12 text-primary-600 mx-auto mb-3" />
          <div className="text-2xl font-bold text-gray-900">
            {state.products.length}
          </div>
          <div className="text-sm text-gray-600">Productos Totales</div>
        </div>
        
        <div className="card text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-warning-600 mx-auto mb-3" />
          <div className="text-2xl font-bold text-warning-600">
            {lowStockProducts.length}
          </div>
          <div className="text-sm text-gray-600">Stock Bajo</div>
        </div>
        
        <div className="card text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-danger-600 mx-auto mb-3" />
          <div className="text-2xl font-bold text-danger-600">
            {outOfStockProducts.length}
          </div>
          <div className="text-sm text-gray-600">Sin Stock</div>
        </div>
        
        <div className="card text-center">
          <ClipboardDocumentListIcon className="w-12 h-12 text-success-600 mx-auto mb-3" />
          <div className="text-2xl font-bold text-success-600">
            {formatCurrency(totalInventoryValue)}
          </div>
          <div className="text-sm text-gray-600">Valor Total</div>
        </div>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">
              Productos con Stock Bajo
            </h2>
          </div>
          
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay productos con stock bajo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.slice(0, 10).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-warning-50 rounded-lg border border-warning-200">
                  <div>
                    <p className="font-medium text-warning-800">{product.name}</p>
                    <p className="text-sm text-warning-700">
                      Stock: {product.stock} / Mínimo: {product.min_stock}
                    </p>
                  </div>
                  <span className="badge-warning">Reabastecer</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Out of Stock */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">
              Productos Sin Stock
            </h2>
          </div>
          
          {outOfStockProducts.length === 0 ? (
            <div className="text-center py-8">
              <CubeIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Todos los productos tienen stock</p>
            </div>
          ) : (
            <div className="space-y-3">
              {outOfStockProducts.slice(0, 10).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-danger-50 rounded-lg border border-danger-200">
                  <div>
                    <p className="font-medium text-danger-800">{product.name}</p>
                    <p className="text-sm text-danger-700">
                      Precio: {formatCurrency(product.price)}
                    </p>
                  </div>
                  <span className="badge-danger">Sin Stock</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All Products */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-medium text-gray-900">
            Estado del Inventario
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header">Producto</th>
                <th className="table-header">Categoría</th>
                <th className="table-header">Stock Actual</th>
                <th className="table-header">Stock Mínimo</th>
                <th className="table-header">Valor en Stock</th>
                <th className="table-header">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {state.products.map((product) => (
                <tr key={product.id} className="table-row">
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
                    {product.category ? (
                      <span className="badge-gray">{product.category}</span>
                    ) : (
                      <span className="text-gray-400">Sin categoría</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className={`font-medium ${
                      product.stock === 0 
                        ? 'text-danger-600'
                        : product.stock <= product.min_stock 
                        ? 'text-warning-600' 
                        : 'text-gray-900'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="table-cell">
                    {product.min_stock}
                  </td>
                  <td className="table-cell font-medium">
                    {formatCurrency(product.stock * product.price)}
                  </td>
                  <td className="table-cell">
                    {product.stock === 0 ? (
                      <span className="badge-danger">Sin Stock</span>
                    ) : product.low_stock ? (
                      <span className="badge-warning">Stock Bajo</span>
                    ) : (
                      <span className="badge-success">Normal</span>
                    )}
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

export default Inventory;