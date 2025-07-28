const express = require('express');
const db = require('../database/database');

const router = express.Router();

// GET /api/dashboard/overview - Vista general del dashboard
router.get('/overview', async (req, res) => {
  try {
    // Estadísticas básicas
    const totalProducts = await db.get('SELECT COUNT(*) as count FROM products');
    const totalSales = await db.get('SELECT COUNT(*) as count FROM sales');
    const lowStockProducts = await db.get(
      'SELECT COUNT(*) as count FROM products WHERE stock <= min_stock'
    );

    // Ventas del día
    const todaySales = await db.get(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as revenue
      FROM sales 
      WHERE DATE(created_at) = DATE('now')
    `);

    // Ventas del mes
    const monthSales = await db.get(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as revenue
      FROM sales 
      WHERE DATE(created_at) >= DATE('now', 'start of month')
    `);

    // Productos más vendidos (últimos 30 días)
    const topProducts = await db.all(`
      SELECT 
        p.name,
        p.category,
        p.price,
        SUM(si.quantity) as total_sold,
        SUM(si.subtotal) as total_revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE DATE(s.created_at) >= DATE('now', '-30 days')
      GROUP BY p.id, p.name, p.category, p.price
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    // Categorías con más ventas
    const topCategories = await db.all(`
      SELECT 
        p.category,
        COUNT(DISTINCT p.id) as products_count,
        SUM(si.quantity) as total_sold,
        SUM(si.subtotal) as total_revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE DATE(s.created_at) >= DATE('now', '-30 days')
        AND p.category IS NOT NULL 
        AND p.category != ''
      GROUP BY p.category
      ORDER BY total_revenue DESC
      LIMIT 5
    `);

    // Ventas por método de pago (últimos 30 días)
    const paymentMethods = await db.all(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(total) as total_amount
      FROM sales 
      WHERE DATE(created_at) >= DATE('now', '-30 days')
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `);

    // Valor total del inventario
    const inventoryValue = await db.get(`
      SELECT 
        COALESCE(SUM(stock * cost), 0) as cost_value,
        COALESCE(SUM(stock * price), 0) as retail_value
      FROM products
    `);

    res.json({
      success: true,
      data: {
        summary: {
          total_products: totalProducts.count,
          total_sales: totalSales.count,
          low_stock_products: lowStockProducts.count,
          today_sales: todaySales.count,
          today_revenue: parseFloat(todaySales.revenue || 0),
          month_sales: monthSales.count,
          month_revenue: parseFloat(monthSales.revenue || 0),
          inventory_cost_value: parseFloat(inventoryValue.cost_value || 0),
          inventory_retail_value: parseFloat(inventoryValue.retail_value || 0)
        },
        top_products: topProducts,
        top_categories: topCategories,
        payment_methods: paymentMethods
      }
    });
  } catch (error) {
    console.error('Error al obtener overview del dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener datos del dashboard'
    });
  }
});

// GET /api/dashboard/alerts - Alertas del sistema
router.get('/alerts', async (req, res) => {
  try {
    // Productos con stock bajo
    const lowStockProducts = await db.all(`
      SELECT 
        id, name, stock, min_stock, category, price
      FROM products 
      WHERE stock <= min_stock
      ORDER BY (stock - min_stock) ASC
    `);

    // Productos sin stock
    const outOfStockProducts = await db.all(`
      SELECT 
        id, name, category, price, min_stock
      FROM products 
      WHERE stock = 0
      ORDER BY name ASC
    `);

    // Productos sin categoría
    const uncategorizedProducts = await db.all(`
      SELECT 
        id, name, stock, price
      FROM products 
      WHERE category IS NULL OR category = ''
      ORDER BY name ASC
      LIMIT 10
    `);

    // Productos sin código de barras
    const productsWithoutBarcode = await db.all(`
      SELECT 
        id, name, category, stock, price
      FROM products 
      WHERE barcode IS NULL OR barcode = ''
      ORDER BY name ASC
      LIMIT 10
    `);

    // Ventas recientes grandes (últimas 24 horas)
    const largeSales = await db.all(`
      SELECT 
        s.id, s.total, s.payment_method, s.customer_name, s.created_at,
        COUNT(si.id) as items_count
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE s.created_at >= datetime('now', '-24 hours')
        AND s.total > (
          SELECT AVG(total) * 2 
          FROM sales 
          WHERE created_at >= datetime('now', '-30 days')
        )
      GROUP BY s.id, s.total, s.payment_method, s.customer_name, s.created_at
      ORDER BY s.total DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        low_stock: lowStockProducts,
        out_of_stock: outOfStockProducts,
        uncategorized: uncategorizedProducts,
        without_barcode: productsWithoutBarcode,
        large_sales: largeSales,
        counts: {
          low_stock: lowStockProducts.length,
          out_of_stock: outOfStockProducts.length,
          uncategorized: uncategorizedProducts.length,
          without_barcode: productsWithoutBarcode.length,
          large_sales: largeSales.length
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener alertas'
    });
  }
});

// GET /api/dashboard/sales-chart - Datos para gráfico de ventas
router.get('/sales-chart', async (req, res) => {
  try {
    const { period = 'week', type = 'daily' } = req.query;

    let dateRange = '';
    let groupBy = '';
    let dateFormat = '';

    switch (period) {
      case 'week':
        dateRange = "WHERE DATE(created_at) >= DATE('now', '-7 days')";
        groupBy = 'DATE(created_at)';
        dateFormat = 'DATE(created_at)';
        break;
      case 'month':
        dateRange = "WHERE DATE(created_at) >= DATE('now', '-30 days')";
        groupBy = 'DATE(created_at)';
        dateFormat = 'DATE(created_at)';
        break;
      case 'year':
        dateRange = "WHERE DATE(created_at) >= DATE('now', '-365 days')";
        groupBy = "strftime('%Y-%m', created_at)";
        dateFormat = "strftime('%Y-%m', created_at)";
        break;
      default:
        dateRange = "WHERE DATE(created_at) >= DATE('now', '-7 days')";
        groupBy = 'DATE(created_at)';
        dateFormat = 'DATE(created_at)';
    }

    const salesData = await db.all(`
      SELECT 
        ${dateFormat} as period,
        COUNT(*) as sales_count,
        SUM(total) as total_revenue,
        AVG(total) as avg_sale
      FROM sales 
      ${dateRange}
      GROUP BY ${groupBy}
      ORDER BY period ASC
    `);

    // Completar días faltantes con ceros
    const filledData = [];
    if (period === 'week' || period === 'month') {
      const days = period === 'week' ? 7 : 30;
      const today = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const existingData = salesData.find(d => d.period === dateStr);
        filledData.push({
          period: dateStr,
          sales_count: existingData ? existingData.sales_count : 0,
          total_revenue: existingData ? parseFloat(existingData.total_revenue) : 0,
          avg_sale: existingData ? parseFloat(existingData.avg_sale) : 0
        });
      }
    } else {
      filledData.push(...salesData.map(d => ({
        ...d,
        total_revenue: parseFloat(d.total_revenue),
        avg_sale: parseFloat(d.avg_sale)
      })));
    }

    res.json({
      success: true,
      data: filledData,
      period,
      type
    });
  } catch (error) {
    console.error('Error al obtener datos del gráfico:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener datos del gráfico'
    });
  }
});

// GET /api/dashboard/top-products - Productos más vendidos
router.get('/top-products', async (req, res) => {
  try {
    const { period = 'month', limit = 10 } = req.query;

    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "WHERE DATE(s.created_at) >= DATE('now', '-7 days')";
        break;
      case 'month':
        dateFilter = "WHERE DATE(s.created_at) >= DATE('now', '-30 days')";
        break;
      case 'year':
        dateFilter = "WHERE DATE(s.created_at) >= DATE('now', '-365 days')";
        break;
      case 'all':
        dateFilter = '';
        break;
    }

    const topProducts = await db.all(`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.price,
        p.cost,
        p.stock,
        SUM(si.quantity) as total_sold,
        SUM(si.subtotal) as total_revenue,
        COUNT(DISTINCT s.id) as sales_count,
        ((p.price - p.cost) * SUM(si.quantity)) as total_profit
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      ${dateFilter}
      GROUP BY p.id, p.name, p.category, p.price, p.cost, p.stock
      ORDER BY total_sold DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json({
      success: true,
      data: topProducts.map(product => ({
        ...product,
        total_revenue: parseFloat(product.total_revenue),
        total_profit: parseFloat(product.total_profit),
        profit_margin: product.cost > 0 ? 
          (((product.price - product.cost) / product.cost) * 100).toFixed(2) : '0.00'
      })),
      period,
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error al obtener productos más vendidos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener productos más vendidos'
    });
  }
});

// GET /api/dashboard/inventory-summary - Resumen del inventario
router.get('/inventory-summary', async (req, res) => {
  try {
    // Resumen por categorías
    const categoryStats = await db.all(`
      SELECT 
        COALESCE(category, 'Sin categoría') as category,
        COUNT(*) as products_count,
        SUM(stock) as total_stock,
        SUM(stock * cost) as total_cost_value,
        SUM(stock * price) as total_retail_value,
        AVG(stock) as avg_stock,
        COUNT(CASE WHEN stock <= min_stock THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN stock = 0 THEN 1 END) as out_of_stock_count
      FROM products
      GROUP BY category
      ORDER BY total_retail_value DESC
    `);

    // Productos con mayor valor en inventario
    const highValueProducts = await db.all(`
      SELECT 
        id, name, category, stock, cost, price,
        (stock * cost) as inventory_cost_value,
        (stock * price) as inventory_retail_value
      FROM products
      WHERE stock > 0
      ORDER BY inventory_retail_value DESC
      LIMIT 10
    `);

    // Movimientos de stock recientes
    const recentMovements = await db.all(`
      SELECT 
        sm.*, p.name as product_name, p.category
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      ORDER BY sm.created_at DESC
      LIMIT 20
    `);

    // Estadísticas generales
    const generalStats = await db.get(`
      SELECT 
        COUNT(*) as total_products,
        SUM(stock) as total_units,
        SUM(stock * cost) as total_cost_value,
        SUM(stock * price) as total_retail_value,
        COUNT(CASE WHEN stock <= min_stock THEN 1 END) as low_stock_products,
        COUNT(CASE WHEN stock = 0 THEN 1 END) as out_of_stock_products,
        COUNT(DISTINCT category) as categories_count
      FROM products
    `);

    res.json({
      success: true,
      data: {
        general_stats: {
          ...generalStats,
          total_cost_value: parseFloat(generalStats.total_cost_value || 0),
          total_retail_value: parseFloat(generalStats.total_retail_value || 0),
          potential_profit: parseFloat(generalStats.total_retail_value || 0) - 
                           parseFloat(generalStats.total_cost_value || 0)
        },
        category_stats: categoryStats.map(cat => ({
          ...cat,
          total_cost_value: parseFloat(cat.total_cost_value || 0),
          total_retail_value: parseFloat(cat.total_retail_value || 0),
          potential_profit: parseFloat(cat.total_retail_value || 0) - 
                           parseFloat(cat.total_cost_value || 0)
        })),
        high_value_products: highValueProducts.map(prod => ({
          ...prod,
          inventory_cost_value: parseFloat(prod.inventory_cost_value),
          inventory_retail_value: parseFloat(prod.inventory_retail_value)
        })),
        recent_movements: recentMovements
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen de inventario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener resumen de inventario'
    });
  }
});

module.exports = router;