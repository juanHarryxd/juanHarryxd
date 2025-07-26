import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../context/AppContext';
import { formatCurrency, productService, handleSuccess } from '../services/api';
import toast from 'react-hot-toast';

const Products = () => {
  const { state, actions } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [searchTerm, selectedCategory, showLowStock]);

  const loadProducts = () => {
    actions.loadProducts({
      search: searchTerm,
      category: selectedCategory,
      lowStock: showLowStock
    });
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${product.name}"?`)) {
      try {
        await productService.delete(product.id);
        handleSuccess('Producto eliminado exitosamente');
        loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const filteredProducts = state.products;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="mt-2 text-gray-600">
            Gestiona tu inventario de productos
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleAddProduct}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Agregar Producto</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <select
            className="input"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {state.categories.map((category) => (
              <option key={category.category} value={category.category}>
                {category.category} ({category.product_count})
              </option>
            ))}
          </select>

          {/* Low Stock Filter */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Solo stock bajo</span>
          </label>

          {/* Stats */}
          <div className="text-sm text-gray-600">
            {filteredProducts.length} productos encontrados
          </div>
        </div>
      </div>

      {/* Products Table */}
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
                  <th className="table-header">Producto</th>
                  <th className="table-header">Categoría</th>
                  <th className="table-header">Precio</th>
                  <th className="table-header">Costo</th>
                  <th className="table-header">Stock</th>
                  <th className="table-header">Margen</th>
                  <th className="table-header">Estado</th>
                  <th className="table-header">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <div className="font-medium text-gray-900">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-sm text-gray-500">
                            {product.description}
                          </div>
                        )}
                        {product.barcode && (
                          <div className="text-xs text-gray-400">
                            Código: {product.barcode}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      {product.category ? (
                        <span className="badge-gray">{product.category}</span>
                      ) : (
                        <span className="text-gray-400">Sin categoría</span>
                      )}
                    </td>
                    <td className="table-cell font-medium">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="table-cell">
                      {formatCurrency(product.cost)}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${
                          product.stock <= product.min_stock 
                            ? 'text-danger-600' 
                            : 'text-gray-900'
                        }`}>
                          {product.stock}
                        </span>
                        {product.stock <= product.min_stock && (
                          <ExclamationTriangleIcon className="w-4 h-4 text-warning-500" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Mín: {product.min_stock}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm font-medium text-success-600">
                        {product.profit_margin}%
                      </span>
                    </td>
                    <td className="table-cell">
                      {product.stock === 0 ? (
                        <span className="badge-danger">Sin Stock</span>
                      ) : product.low_stock ? (
                        <span className="badge-warning">Stock Bajo</span>
                      ) : (
                        <span className="badge-success">Disponible</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                          title="Editar producto"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="p-1 text-gray-400 hover:text-danger-600 transition-colors"
                          title="Eliminar producto"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProducts.length === 0 && !state.loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FunnelIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron productos
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || selectedCategory || showLowStock
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'Comienza agregando tu primer producto'}
                </p>
                {!searchTerm && !selectedCategory && !showLowStock && (
                  <button
                    onClick={handleAddProduct}
                    className="btn-primary"
                  >
                    Agregar Primer Producto
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {showAddModal && (
        <ProductModal
          product={editingProduct}
          categories={state.categories}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false);
            loadProducts();
          }}
        />
      )}
    </div>
  );
};

// Product Modal Component
const ProductModal = ({ product, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    cost: product?.cost || '',
    stock: product?.stock || '',
    min_stock: product?.min_stock || '',
    category: product?.category || '',
    barcode: product?.barcode || '',
    image_url: product?.image_url || '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        stock: parseInt(formData.stock),
        min_stock: parseInt(formData.min_stock),
      };

      if (product) {
        await productService.update(product.id, data);
        handleSuccess('Producto actualizado exitosamente');
      } else {
        await productService.create(data);
        handleSuccess('Producto creado exitosamente');
      }

      onSave();
    } catch (error) {
      if (error.response?.data?.details) {
        const fieldErrors = {};
        error.response.data.details.forEach(detail => {
          const field = detail.split(' ')[0].toLowerCase();
          fieldErrors[field] = detail;
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {product ? 'Editar Producto' : 'Agregar Producto'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="label">Nombre *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input ${errors.name ? 'input-error' : ''}`}
                required
              />
              {errors.name && <p className="text-sm text-danger-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="label">Categoría</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input"
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((cat) => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label">Descripción</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input"
                rows={3}
              />
            </div>

            <div>
              <label className="label">Precio de Venta *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className={`input ${errors.price ? 'input-error' : ''}`}
                required
              />
              {errors.price && <p className="text-sm text-danger-600 mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="label">Costo *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                className={`input ${errors.cost ? 'input-error' : ''}`}
                required
              />
              {errors.cost && <p className="text-sm text-danger-600 mt-1">{errors.cost}</p>}
            </div>

            <div>
              <label className="label">Stock Actual *</label>
              <input
                type="number"
                min="0"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className={`input ${errors.stock ? 'input-error' : ''}`}
                required
              />
              {errors.stock && <p className="text-sm text-danger-600 mt-1">{errors.stock}</p>}
            </div>

            <div>
              <label className="label">Stock Mínimo *</label>
              <input
                type="number"
                min="0"
                name="min_stock"
                value={formData.min_stock}
                onChange={handleChange}
                className={`input ${errors.min_stock ? 'input-error' : ''}`}
                required
              />
              {errors.min_stock && <p className="text-sm text-danger-600 mt-1">{errors.min_stock}</p>}
            </div>

            <div>
              <label className="label">Código de Barras</label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                className={`input ${errors.barcode ? 'input-error' : ''}`}
              />
              {errors.barcode && <p className="text-sm text-danger-600 mt-1">{errors.barcode}</p>}
            </div>

            <div>
              <label className="label">URL de Imagen</label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="input"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
          </div>

          {/* Profit Calculation */}
          {formData.price && formData.cost && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Cálculo de Margen</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Precio:</span>
                  <div className="font-medium">{formatCurrency(parseFloat(formData.price) || 0)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Costo:</span>
                  <div className="font-medium">{formatCurrency(parseFloat(formData.cost) || 0)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Margen:</span>
                  <div className="font-medium text-success-600">
                    {(((parseFloat(formData.price) - parseFloat(formData.cost)) / parseFloat(formData.cost)) * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Guardando...' : (product ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Products;