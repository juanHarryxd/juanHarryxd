import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../context/AppContext';
import { formatCurrency, salesService, handleSuccess } from '../services/api';

const NewSale = () => {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    paymentMethod: 'efectivo',
    notes: ''
  });
  const [processing, setProcessing] = useState(false);

  const filteredProducts = state.products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm))
  );

  const cartTotal = state.cart.reduce((total, item) => 
    total + (item.quantity * item.unit_price), 0
  );

  const handleAddToCart = (product) => {
    if (product.stock <= 0) {
      return;
    }
    actions.addToCart(product, 1);
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      actions.removeFromCart(productId);
    } else {
      actions.updateCartItem(productId, { quantity: newQuantity });
    }
  };

  const handleProcessSale = async () => {
    if (state.cart.length === 0) {
      return;
    }

    setProcessing(true);
    try {
      const saleData = {
        items: state.cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        payment_method: customerData.paymentMethod,
        customer_name: customerData.name || null,
        customer_phone: customerData.phone || null,
        notes: customerData.notes || null
      };

      await salesService.create(saleData);
      handleSuccess('Venta procesada exitosamente');
      actions.clearCart();
      navigate('/sales');
    } catch (error) {
      console.error('Error processing sale:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Venta</h1>
          <p className="mt-2 text-gray-600">
            Selecciona productos para agregar al carrito
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar productos por nombre o código..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  {product.description && (
                    <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-bold text-success-600">
                      {formatCurrency(product.price)}
                    </span>
                    <span className={`text-sm ${
                      product.stock <= product.min_stock 
                        ? 'text-warning-600' 
                        : 'text-gray-600'
                    }`}>
                      Stock: {product.stock}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleAddToCart(product)}
                disabled={product.stock <= 0}
                className={`w-full btn ${
                  product.stock <= 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'btn-primary'
                }`}
              >
                {product.stock <= 0 ? 'Sin Stock' : 'Agregar al Carrito'}
              </button>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron productos
            </h3>
            <p className="text-gray-500">
              Intenta buscar con otros términos
            </p>
          </div>
        )}
      </div>

      {/* Cart Section */}
      <div className="space-y-6">
        {/* Cart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Carrito</h2>
            <ShoppingCartIcon className="w-6 h-6 text-gray-400" />
          </div>

          {state.cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCartIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">El carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-3">
              {state.cart.map((item) => (
                <div key={item.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(item.unit_price)} c/u
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <MinusIcon className="w-4 h-4" />
                    </button>
                    
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    
                    <button
                      onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      disabled={item.quantity >= item.stock}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => actions.removeFromCart(item.product_id)}
                      className="p-1 text-gray-400 hover:text-danger-600 ml-2"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total:</span>
                  <span className="text-xl font-bold text-success-600">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Customer Data */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Datos del Cliente
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">Nombre (Opcional)</label>
              <input
                type="text"
                className="input"
                value={customerData.name}
                onChange={(e) => setCustomerData(prev => ({
                  ...prev, name: e.target.value
                }))}
                placeholder="Nombre del cliente"
              />
            </div>
            
            <div>
              <label className="label">Teléfono (Opcional)</label>
              <input
                type="tel"
                className="input"
                value={customerData.phone}
                onChange={(e) => setCustomerData(prev => ({
                  ...prev, phone: e.target.value
                }))}
                placeholder="Teléfono del cliente"
              />
            </div>
            
            <div>
              <label className="label">Método de Pago</label>
              <select
                className="input"
                value={customerData.paymentMethod}
                onChange={(e) => setCustomerData(prev => ({
                  ...prev, paymentMethod: e.target.value
                }))}
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
            
            <div>
              <label className="label">Notas (Opcional)</label>
              <textarea
                className="input"
                rows={3}
                value={customerData.notes}
                onChange={(e) => setCustomerData(prev => ({
                  ...prev, notes: e.target.value
                }))}
                placeholder="Notas adicionales sobre la venta"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleProcessSale}
            disabled={state.cart.length === 0 || processing}
            className="w-full btn-success py-3 text-lg font-medium"
          >
            {processing ? 'Procesando...' : `Procesar Venta - ${formatCurrency(cartTotal)}`}
          </button>
          
          <button
            onClick={() => actions.clearCart()}
            disabled={state.cart.length === 0}
            className="w-full btn-secondary"
          >
            Limpiar Carrito
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewSale;