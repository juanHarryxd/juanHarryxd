const express = require('express');
const Joi = require('joi');
const db = require('../database/database');

const router = express.Router();

// Esquema de validación para ventas
const saleSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      product_id: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().positive().required(),
      unit_price: Joi.number().positive().required()
    })
  ).min(1).required(),
  payment_method: Joi.string().valid('efectivo', 'tarjeta', 'transferencia').default('efectivo'),
  customer_name: Joi.string().allow('').max(255),
  customer_phone: Joi.string().allow('').max(20),
  notes: Joi.string().allow('').max(500)
});

// GET /api/sales - Obtener todas las ventas
router.get('/', async (req, res) => {
  try {
    const { 
      start_date, 
      end_date, 
      payment_method, 
      customer_name,
      page = 1, 
      limit = 50 
    } = req.query;

    let sql = `
      SELECT s.*, 
             COUNT(si.id) as items_count,
             GROUP_CONCAT(p.name, ' (x' || si.quantity || ')') as products_summary
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      sql += ' AND DATE(s.created_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND DATE(s.created_at) <= ?';
      params.push(end_date);
    }

    if (payment_method) {
      sql += ' AND s.payment_method = ?';
      params.push(payment_method);
    }

    if (customer_name) {
      sql += ' AND s.customer_name LIKE ?';
      params.push(`%${customer_name}%`);
    }

    sql += ' GROUP BY s.id ORDER BY s.created_at DESC';

    // Paginación
    const offset = (page - 1) * limit;
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const sales = await db.all(sql, params);

    // Obtener total de ventas para paginación
    let countSql = 'SELECT COUNT(DISTINCT s.id) as total FROM sales s WHERE 1=1';
    const countParams = [];
    
    if (start_date) {
      countSql += ' AND DATE(s.created_at) >= ?';
      countParams.push(start_date);
    }
    if (end_date) {
      countSql += ' AND DATE(s.created_at) <= ?';
      countParams.push(end_date);
    }
    if (payment_method) {
      countSql += ' AND s.payment_method = ?';
      countParams.push(payment_method);
    }
    if (customer_name) {
      countSql += ' AND s.customer_name LIKE ?';
      countParams.push(`%${customer_name}%`);
    }

    const totalResult = await db.get(countSql, countParams);
    const total = totalResult.total;

    res.json({
      success: true,
      data: sales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener ventas'
    });
  }
});

// GET /api/sales/:id - Obtener una venta específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de venta inválido'
      });
    }

    const sale = await db.get('SELECT * FROM sales WHERE id = ?', [id]);
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Venta no encontrada'
      });
    }

    // Obtener items de la venta
    const items = await db.all(`
      SELECT si.*, p.name as product_name, p.barcode, p.category
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
      ORDER BY si.id ASC
    `, [id]);

    res.json({
      success: true,
      data: {
        ...sale,
        items
      }
    });
  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener venta'
    });
  }
});

// POST /api/sales - Crear nueva venta
router.post('/', async (req, res) => {
  try {
    const { error, value } = saleSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    // Verificar stock disponible para todos los productos
    const stockErrors = [];
    for (const item of value.items) {
      const product = await db.get(
        'SELECT id, name, stock, price FROM products WHERE id = ?',
        [item.product_id]
      );

      if (!product) {
        stockErrors.push(`Producto con ID ${item.product_id} no encontrado`);
        continue;
      }

      if (product.stock < item.quantity) {
        stockErrors.push(
          `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`
        );
      }

      // Verificar que el precio unitario coincida (opcional, para evitar manipulación)
      if (Math.abs(product.price - item.unit_price) > 0.01) {
        stockErrors.push(
          `Precio incorrecto para ${product.name}. Precio actual: $${product.price}`
        );
      }
    }

    if (stockErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Errores de validación',
        details: stockErrors
      });
    }

    // Calcular total
    const total = value.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);

    // Iniciar transacción (simulada con try-catch)
    try {
      // Crear la venta
      const saleResult = await db.run(`
        INSERT INTO sales (total, payment_method, customer_name, customer_phone, notes)
        VALUES (?, ?, ?, ?, ?)
      `, [
        total.toFixed(2),
        value.payment_method,
        value.customer_name || null,
        value.customer_phone || null,
        value.notes || null
      ]);

      const saleId = saleResult.id;

      // Crear items de venta y actualizar stock
      for (const item of value.items) {
        const subtotal = item.quantity * item.unit_price;

        // Insertar item de venta
        await db.run(`
          INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
          VALUES (?, ?, ?, ?, ?)
        `, [saleId, item.product_id, item.quantity, item.unit_price, subtotal.toFixed(2)]);

        // Actualizar stock del producto
        await db.run(`
          UPDATE products 
          SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `, [item.quantity, item.product_id]);

        // Registrar movimiento de stock
        await db.run(`
          INSERT INTO stock_movements (product_id, type, quantity, reason, reference_id)
          VALUES (?, 'salida', ?, 'Venta', ?)
        `, [item.product_id, item.quantity, saleId]);
      }

      // Obtener la venta completa
      const completeSale = await db.get('SELECT * FROM sales WHERE id = ?', [saleId]);
      const saleItems = await db.all(`
        SELECT si.*, p.name as product_name
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
      `, [saleId]);

      res.status(201).json({
        success: true,
        message: 'Venta registrada exitosamente',
        data: {
          ...completeSale,
          items: saleItems
        }
      });

    } catch (transactionError) {
      console.error('Error en transacción de venta:', transactionError);
      res.status(500).json({
        success: false,
        error: 'Error al procesar la venta'
      });
    }

  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear venta'
    });
  }
});

// DELETE /api/sales/:id - Anular venta (devolver stock)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de venta inválido'
      });
    }

    const sale = await db.get('SELECT * FROM sales WHERE id = ?', [id]);
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Venta no encontrada'
      });
    }

    // Obtener items de la venta
    const saleItems = await db.all(
      'SELECT * FROM sale_items WHERE sale_id = ?',
      [id]
    );

    try {
      // Devolver stock a los productos
      for (const item of saleItems) {
        await db.run(`
          UPDATE products 
          SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `, [item.quantity, item.product_id]);

        // Registrar movimiento de devolución
        await db.run(`
          INSERT INTO stock_movements (product_id, type, quantity, reason, reference_id)
          VALUES (?, 'entrada', ?, ?, ?)
        `, [
          item.product_id, 
          item.quantity, 
          reason || 'Anulación de venta', 
          id
        ]);
      }

      // Eliminar la venta (CASCADE eliminará los items)
      await db.run('DELETE FROM sales WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Venta anulada exitosamente'
      });

    } catch (transactionError) {
      console.error('Error al anular venta:', transactionError);
      res.status(500).json({
        success: false,
        error: 'Error al anular la venta'
      });
    }

  } catch (error) {
    console.error('Error al anular venta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al anular venta'
    });
  }
});

// GET /api/sales/stats/summary - Estadísticas resumidas de ventas
router.get('/stats/summary', async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    let dateFilter = '';
    const params = [];

    switch (period) {
      case 'today':
        dateFilter = 'WHERE DATE(created_at) = DATE("now")';
        break;
      case 'week':
        dateFilter = 'WHERE DATE(created_at) >= DATE("now", "-7 days")';
        break;
      case 'month':
        dateFilter = 'WHERE DATE(created_at) >= DATE("now", "-1 month")';
        break;
      case 'year':
        dateFilter = 'WHERE DATE(created_at) >= DATE("now", "-1 year")';
        break;
    }

    // Total de ventas y cantidad
    const salesSummary = await db.get(`
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(AVG(total), 0) as average_sale
      FROM sales 
      ${dateFilter}
    `, params);

    // Productos más vendidos
    const topProducts = await db.all(`
      SELECT 
        p.name,
        p.category,
        SUM(si.quantity) as total_sold,
        SUM(si.subtotal) as total_revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      ${dateFilter.replace('WHERE', 'WHERE')}
      GROUP BY p.id, p.name, p.category
      ORDER BY total_sold DESC
      LIMIT 5
    `, params);

    // Métodos de pago
    const paymentMethods = await db.all(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(total) as total_amount
      FROM sales 
      ${dateFilter}
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `, params);

    res.json({
      success: true,
      data: {
        summary: salesSummary,
        top_products: topProducts,
        payment_methods: paymentMethods,
        period
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
});

// GET /api/sales/stats/daily - Ventas diarias para gráficos
router.get('/stats/daily', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const dailySales = await db.all(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as sales_count,
        SUM(total) as total_revenue
      FROM sales 
      WHERE DATE(created_at) >= DATE('now', '-${parseInt(days)} days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json({
      success: true,
      data: dailySales
    });
  } catch (error) {
    console.error('Error al obtener ventas diarias:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener ventas diarias'
    });
  }
});

module.exports = router;