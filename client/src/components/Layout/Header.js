import React, { useState } from 'react';
import { 
  Bars3Icon, 
  BellIcon, 
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../services/api';

const Header = () => {
  const { state, actions } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  const alertsCount = state.alerts ? 
    (state.alerts.counts.low_stock + state.alerts.counts.out_of_stock) : 0;

  const todayRevenue = state.dashboardData?.summary?.today_revenue || 0;
  const todaySales = state.dashboardData?.summary?.today_sales || 0;

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={actions.toggleSidebar}
          >
            <span className="sr-only">Abrir menú</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Page title and stats */}
          <div className="hidden sm:block">
            <h1 className="text-2xl font-bold text-gray-900">
              Organizador de Ventas
            </h1>
            <div className="flex items-center space-x-6 mt-1">
              <div className="flex items-center text-sm text-gray-600">
                <ShoppingCartIcon className="w-4 h-4 mr-1" />
                <span>Hoy: {todaySales} ventas</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-success-500 rounded-full mr-1"></span>
                <span>{formatCurrency(todayRevenue)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Search bar - hidden on mobile */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Buscar productos, ventas..."
              />
            </div>
          </div>

          {/* Cart indicator */}
          {state.cart.length > 0 && (
            <div className="relative">
              <div className="flex items-center space-x-2 bg-success-50 text-success-700 px-3 py-2 rounded-lg border border-success-200">
                <ShoppingCartIcon className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {state.cart.length} {state.cart.length === 1 ? 'producto' : 'productos'}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                  {formatCurrency(state.cart.reduce((total, item) => total + (item.quantity * item.unit_price), 0))}
                </span>
              </div>
            </div>
          )}

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <span className="sr-only">Ver notificaciones</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
              {alertsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                  {alertsCount > 9 ? '9+' : alertsCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Notificaciones
                  </h3>
                  
                  {state.alerts && (
                    <div className="space-y-3">
                      {/* Stock bajo */}
                      {state.alerts.counts.low_stock > 0 && (
                        <div className="flex items-start space-x-3 p-3 bg-warning-50 rounded-lg border border-warning-200">
                          <ExclamationTriangleIcon className="w-5 h-5 text-warning-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-warning-800">
                              Stock Bajo
                            </p>
                            <p className="text-sm text-warning-700">
                              {state.alerts.counts.low_stock} productos con stock bajo
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Sin stock */}
                      {state.alerts.counts.out_of_stock > 0 && (
                        <div className="flex items-start space-x-3 p-3 bg-danger-50 rounded-lg border border-danger-200">
                          <ExclamationTriangleIcon className="w-5 h-5 text-danger-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-danger-800">
                              Sin Stock
                            </p>
                            <p className="text-sm text-danger-700">
                              {state.alerts.counts.out_of_stock} productos sin stock
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Ventas grandes recientes */}
                      {state.alerts.counts.large_sales > 0 && (
                        <div className="flex items-start space-x-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
                          <ShoppingCartIcon className="w-5 h-5 text-primary-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-primary-800">
                              Ventas Destacadas
                            </p>
                            <p className="text-sm text-primary-700">
                              {state.alerts.counts.large_sales} ventas grandes recientes
                            </p>
                          </div>
                        </div>
                      )}

                      {alertsCount === 0 && (
                        <div className="text-center py-4">
                          <BellIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            No hay notificaciones nuevas
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {alertsCount > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <button
                        type="button"
                        className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                        onClick={() => {
                          setShowNotifications(false);
                          // Navigate to inventory or alerts page
                        }}
                      >
                        Ver todas las alertas
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center space-x-3 p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">JH</span>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-900">Juan Harry</p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden px-6 pb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Buscar productos, ventas..."
          />
        </div>
      </div>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </header>
  );
};

export default Header;