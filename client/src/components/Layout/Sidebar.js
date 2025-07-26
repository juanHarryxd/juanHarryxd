import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  CubeIcon,
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../../context/AppContext';

const Sidebar = () => {
  const { state, actions } = useApp();
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      current: location.pathname === '/' || location.pathname === '/dashboard',
    },
    {
      name: 'Productos',
      href: '/products',
      icon: CubeIcon,
      current: location.pathname === '/products',
    },
    {
      name: 'Nueva Venta',
      href: '/sales/new',
      icon: PlusCircleIcon,
      current: location.pathname === '/sales/new',
      highlight: true,
    },
    {
      name: 'Ventas',
      href: '/sales',
      icon: ShoppingCartIcon,
      current: location.pathname === '/sales',
    },
    {
      name: 'Inventario',
      href: '/inventory',
      icon: ClipboardDocumentListIcon,
      current: location.pathname === '/inventory',
    },
    {
      name: 'Reportes',
      href: '/reports',
      icon: DocumentChartBarIcon,
      current: location.pathname === '/reports',
    },
  ];

  const bottomNavigation = [
    {
      name: 'Configuración',
      href: '/settings',
      icon: Cog6ToothIcon,
      current: location.pathname === '/settings',
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 transition-all duration-300 ${
        state.sidebarOpen ? 'lg:w-64' : 'lg:w-20'
      }`}>
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 py-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-5 h-5 text-white" />
              </div>
              {state.sidebarOpen && (
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-900">VentaStock</h1>
                  <p className="text-xs text-gray-500">Organizador de Ventas</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 pb-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  item.current
                    ? 'sidebar-link-active'
                    : item.highlight
                    ? 'sidebar-link bg-success-50 text-success-700 hover:bg-success-100'
                    : 'sidebar-link-inactive'
                } group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200`}
                title={!state.sidebarOpen ? item.name : ''}
              >
                <item.icon
                  className={`${
                    item.current
                      ? 'text-primary-600'
                      : item.highlight
                      ? 'text-success-600'
                      : 'text-gray-400 group-hover:text-gray-600'
                  } flex-shrink-0 w-6 h-6 transition-colors duration-200`}
                  aria-hidden="true"
                />
                {state.sidebarOpen && (
                  <span className="ml-3 truncate">{item.name}</span>
                )}
                {item.highlight && state.sidebarOpen && (
                  <span className="ml-auto">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                      ¡Nuevo!
                    </span>
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Bottom Navigation */}
          <div className="flex-shrink-0 px-3 pb-4 space-y-1">
            {bottomNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  item.current ? 'sidebar-link-active' : 'sidebar-link-inactive'
                } group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200`}
                title={!state.sidebarOpen ? item.name : ''}
              >
                <item.icon
                  className={`${
                    item.current
                      ? 'text-primary-600'
                      : 'text-gray-400 group-hover:text-gray-600'
                  } flex-shrink-0 w-6 h-6 transition-colors duration-200`}
                  aria-hidden="true"
                />
                {state.sidebarOpen && (
                  <span className="ml-3 truncate">{item.name}</span>
                )}
              </Link>
            ))}
            
            {/* Toggle Button */}
            <button
              onClick={actions.toggleSidebar}
              className="sidebar-link-inactive group flex items-center w-full px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200"
              title={state.sidebarOpen ? 'Contraer menú' : 'Expandir menú'}
            >
              <svg
                className={`text-gray-400 group-hover:text-gray-600 flex-shrink-0 w-6 h-6 transition-all duration-200 ${
                  state.sidebarOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
              {state.sidebarOpen && (
                <span className="ml-3 truncate">Contraer</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-0 z-50 flex transition-transform duration-300 ${
        state.sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="relative flex flex-col flex-1 w-64 max-w-xs bg-white border-r border-gray-200">
          {/* Close button */}
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={actions.toggleSidebar}
            >
              <span className="sr-only">Cerrar sidebar</span>
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Mobile navigation content - same as desktop but always expanded */}
          <div className="flex flex-col flex-grow">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-4 py-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-900">VentaStock</h1>
                  <p className="text-xs text-gray-500">Organizador de Ventas</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 pb-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={actions.toggleSidebar}
                  className={`${
                    item.current
                      ? 'sidebar-link-active'
                      : item.highlight
                      ? 'sidebar-link bg-success-50 text-success-700 hover:bg-success-100'
                      : 'sidebar-link-inactive'
                  } group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200`}
                >
                  <item.icon
                    className={`${
                      item.current
                        ? 'text-primary-600'
                        : item.highlight
                        ? 'text-success-600'
                        : 'text-gray-400 group-hover:text-gray-600'
                    } flex-shrink-0 w-6 h-6 transition-colors duration-200`}
                    aria-hidden="true"
                  />
                  <span className="ml-3 truncate">{item.name}</span>
                  {item.highlight && (
                    <span className="ml-auto">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                        ¡Nuevo!
                      </span>
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            {/* Bottom Navigation */}
            <div className="flex-shrink-0 px-3 pb-4 space-y-1">
              {bottomNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={actions.toggleSidebar}
                  className={`${
                    item.current ? 'sidebar-link-active' : 'sidebar-link-inactive'
                  } group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200`}
                >
                  <item.icon
                    className={`${
                      item.current
                        ? 'text-primary-600'
                        : 'text-gray-400 group-hover:text-gray-600'
                    } flex-shrink-0 w-6 h-6 transition-colors duration-200`}
                    aria-hidden="true"
                  />
                  <span className="ml-3 truncate">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        {/* Overlay */}
        <div className="flex-shrink-0 w-14" aria-hidden="true">
          {/* Force sidebar to shrink to fit close icon */}
        </div>
      </div>
    </>
  );
};

export default Sidebar;