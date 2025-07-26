# 📊 VentaStock - Organizador de Ventas y Stock

Un sistema completo de gestión de ventas e inventario desarrollado con React y Node.js, diseñado para pequeñas y medianas empresas que necesitan un control eficiente de sus productos y ventas.

## ✨ Características Principales

### 🎯 Dashboard Inteligente
- **Estadísticas en tiempo real** de ventas y productos
- **Gráficos interactivos** con tendencias de ventas
- **Alertas automáticas** de stock bajo y productos sin stock
- **Métricas de negocio** como ingresos, márgenes y productos más vendidos

### 📦 Gestión de Productos
- **CRUD completo** de productos con validación
- **Control de stock** con niveles mínimos configurables
- **Categorización** automática de productos
- **Códigos de barras** para identificación rápida
- **Cálculo automático** de márgenes de ganancia

### 💰 Sistema de Ventas
- **Punto de venta** intuitivo con carrito de compras
- **Múltiples métodos de pago** (efectivo, tarjeta, transferencia)
- **Gestión de clientes** con datos opcionales
- **Control automático** de stock en tiempo real
- **Historial completo** de transacciones

### 📈 Reportes y Análisis
- **Reportes detallados** por períodos personalizables
- **Productos más vendidos** con análisis de rentabilidad
- **Tendencias de ventas** con gráficos visuales
- **Análisis por categorías** de productos

### 🔔 Sistema de Alertas
- **Notificaciones automáticas** de stock bajo
- **Alertas de productos** sin stock
- **Ventas destacadas** por encima del promedio
- **Panel de alertas** centralizado

## 🚀 Tecnologías Utilizadas

### Backend
- **Node.js** + **Express.js** - Servidor y API REST
- **SQLite** - Base de datos ligera y eficiente
- **Joi** - Validación de datos
- **Helmet** + **CORS** - Seguridad
- **Rate Limiting** - Control de peticiones

### Frontend
- **React 18** - Interfaz de usuario moderna
- **React Router** - Navegación SPA
- **Tailwind CSS** - Diseño responsive y moderno
- **Heroicons** - Iconografía consistente
- **Recharts** - Gráficos interactivos
- **React Hot Toast** - Notificaciones elegantes
- **Axios** - Cliente HTTP

## 📋 Instalación

### Prerrequisitos
- **Node.js** (versión 16 o superior)
- **npm** (incluido con Node.js)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/juanHarryxd/organizador-ventas-stock.git
cd organizador-ventas-stock
```

2. **Instalar todas las dependencias**
```bash
npm run install-all
```

3. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

4. **Acceder a la aplicación**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

### Comandos Disponibles

```bash
# Desarrollo - Inicia servidor y cliente simultáneamente
npm run dev

# Solo servidor backend
npm run server

# Solo cliente frontend
npm run client

# Construir para producción
npm run build

# Iniciar en producción
npm start

# Instalar todas las dependencias
npm run install-all
```

## 🗄️ Estructura del Proyecto

```
organizador-ventas-stock/
├── client/                 # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   │   └── Layout/     # Layout y navegación
│   │   ├── context/        # Context API para estado global
│   │   ├── pages/          # Páginas principales
│   │   ├── services/       # Servicios y API
│   │   └── index.css       # Estilos globales
│   └── package.json
├── server/                 # Backend Node.js
│   ├── database/           # Configuración de base de datos
│   ├── routes/             # Rutas de la API
│   │   ├── products.js     # Gestión de productos
│   │   ├── sales.js        # Gestión de ventas
│   │   └── dashboard.js    # Estadísticas y dashboard
│   ├── index.js           # Servidor principal
│   └── package.json
└── README.md
```

## 🎨 Capturas de Pantalla

### Dashboard Principal
![Dashboard](https://via.placeholder.com/800x400/3B82F6/FFFFFF?text=Dashboard+Principal)

### Gestión de Productos
![Productos](https://via.placeholder.com/800x400/10B981/FFFFFF?text=Gestión+de+Productos)

### Punto de Venta
![Ventas](https://via.placeholder.com/800x400/F59E0B/FFFFFF?text=Punto+de+Venta)

## 📊 API Endpoints

### Productos
- `GET /api/products` - Listar productos
- `POST /api/products` - Crear producto
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto
- `POST /api/products/:id/adjust-stock` - Ajustar stock

### Ventas
- `GET /api/sales` - Listar ventas
- `POST /api/sales` - Crear venta
- `DELETE /api/sales/:id` - Anular venta
- `GET /api/sales/stats/summary` - Estadísticas de ventas

### Dashboard
- `GET /api/dashboard/overview` - Resumen general
- `GET /api/dashboard/alerts` - Alertas del sistema
- `GET /api/dashboard/sales-chart` - Datos para gráficos

## 🔧 Configuración

### Variables de Entorno (server/.env)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
DB_PATH=./database/inventory.db
JWT_SECRET=tu_clave_secreta_aqui
```

### Personalización
- **Colores**: Modifica `client/tailwind.config.js`
- **Logo**: Cambia el componente en `client/src/components/Layout/Sidebar.js`
- **Moneda**: Ajusta `formatCurrency` en `client/src/services/api.js`

## 🛡️ Seguridad

- **Helmet.js** - Protección de headers HTTP
- **CORS** configurado para dominios específicos
- **Rate Limiting** - Prevención de spam
- **Validación de datos** con Joi
- **Sanitización** de inputs del usuario

## 🚀 Despliegue

### Producción Local
```bash
npm run build
npm start
```

### Docker (Opcional)
```dockerfile
# Dockerfile de ejemplo
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contribuir

1. **Fork** el proyecto
2. **Crea** una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. **Abre** un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Juan Harry** - [@juanHarryxd](https://github.com/juanHarryxd)

## 🙏 Agradecimientos

- **React Team** por el excelente framework
- **Tailwind CSS** por el sistema de diseño
- **Heroicons** por los iconos
- **Recharts** por los gráficos

---

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias:

1. **Issues**: [GitHub Issues](https://github.com/juanHarryxd/organizador-ventas-stock/issues)
2. **Documentación**: Este README
3. **Email**: Contacta al autor

---

⭐ **¡Si te gusta este proyecto, dale una estrella en GitHub!** ⭐
