const express = require('express');
const Joi = require('joi');
const db = require('../database/database');

const router = express.Router();

// Esquema de validación para productos
const productSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().allow('').max(1000),
  price: Joi.number().positive().required(),
  cost: Joi.number().positive().required(),
  stock: Joi.number().integer().min(0).required(),
  min_stock: Joi.number().integer().min(0).required(),
  category: Joi.string().allow('').max(100),
  barcode: Joi.string().allow('').max(50),
  image_url: Joi.string().uri().allow('')
});

// GET /api/products - Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const { category, search, low_stock } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ? OR barcode LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (low_stock === 'true') {
      sql += ' AND stock <= min_stock';
    }

    sql += ' ORDER BY name ASC';

    const products = await db.all(sql, params);
    
    // Agregar indicador de stock bajo
    const productsWithAlerts = products.map(product => ({
      ...product,
      low_stock: product.stock <= product.min_stock,
      profit_margin: ((product.price - product.cost) / product.cost * 100).toFixed(2)
    }));

    res.json({
      success: true,
      data: productsWithAlerts,
      count: productsWithAlerts.length
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener productos'
    });
  }
});

// GET /api/products/:id - Obtener un producto específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de producto inválido'
      });
    }

    const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // Obtener movimientos de stock recientes
    const movements = await db.all(
      `SELECT * FROM stock_movements 
       WHERE product_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...product,
        low_stock: product.stock <= product.min_stock,
        profit_margin: ((product.price - product.cost) / product.cost * 100).toFixed(2),
        recent_movements: movements
      }
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener producto'
    });
  }
});

// POST /api/products - Crear nuevo producto
router.post('/', async (req, res) => {
  try {
    const { error, value } = productSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    // Verificar si el código de barras ya existe
    if (value.barcode) {
      const existingProduct = await db.get(
        'SELECT id FROM products WHERE barcode = ?',
        [value.barcode]
      );
      
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          error: 'El código de barras ya existe'
        });
      }
    }

    const result = await db.run(
      `INSERT INTO products (name, description, price, cost, stock, min_stock, category, barcode, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [value.name, value.description, value.price, value.cost, value.stock, 
       value.min_stock, value.category, value.barcode, value.image_url]
    );

    // Registrar movimiento de stock inicial
    if (value.stock > 0) {
      await db.run(
        `INSERT INTO stock_movements (product_id, type, quantity, reason)
         VALUES (?, 'entrada', ?, 'Stock inicial')`,
        [result.id, value.stock]
      );
    }

    const newProduct = await db.get('SELECT * FROM products WHERE id = ?', [result.id]);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: newProduct
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear producto'
    });
  }
});

// PUT /api/products/:id - Actualizar producto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de producto inválido'
      });
    }

    const { error, value } = productSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    // Verificar si el producto existe
    const existingProduct = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // Verificar código de barras único (excluyendo el producto actual)
    if (value.barcode && value.barcode !== existingProduct.barcode) {
      const duplicateBarcode = await db.get(
        'SELECT id FROM products WHERE barcode = ? AND id != ?',
        [value.barcode, id]
      );
      
      if (duplicateBarcode) {
        return res.status(400).json({
          success: false,
          error: 'El código de barras ya existe'
        });
      }
    }

    // Actualizar producto
    await db.run(
      `UPDATE products 
       SET name = ?, description = ?, price = ?, cost = ?, stock = ?, 
           min_stock = ?, category = ?, barcode = ?, image_url = ?, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [value.name, value.description, value.price, value.cost, value.stock,
       value.min_stock, value.category, value.barcode, value.image_url, id]
    );

    // Registrar movimiento de stock si cambió
    const stockDifference = value.stock - existingProduct.stock;
    if (stockDifference !== 0) {
      const movementType = stockDifference > 0 ? 'entrada' : 'salida';
      const quantity = Math.abs(stockDifference);
      
      await db.run(
        `INSERT INTO stock_movements (product_id, type, quantity, reason)
         VALUES (?, ?, ?, 'Ajuste manual')`,
        [id, movementType, quantity]
      );
    }

    const updatedProduct = await db.get('SELECT * FROM products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar producto'
    });
  }
});

// DELETE /api/products/:id - Eliminar producto
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de producto inválido'
      });
    }

    const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // Verificar si el producto tiene ventas asociadas
    const salesCount = await db.get(
      'SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?',
      [id]
    );

    if (salesCount.count > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar el producto porque tiene ventas asociadas'
      });
    }

    await db.run('DELETE FROM products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar producto'
    });
  }
});

// GET /api/products/categories/list - Obtener lista de categorías
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await db.all(
      `SELECT DISTINCT category, COUNT(*) as product_count 
       FROM products 
       WHERE category IS NOT NULL AND category != '' 
       GROUP BY category 
       ORDER BY category ASC`
    );

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener categorías'
    });
  }
});

// POST /api/products/:id/adjust-stock - Ajustar stock manualmente
router.post('/:id/adjust-stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de producto inválido'
      });
    }

    if (!quantity || isNaN(quantity) || quantity === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cantidad inválida'
      });
    }

    const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    const newStock = product.stock + quantity;
    
    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        error: 'El stock no puede ser negativo'
      });
    }

    // Actualizar stock
    await db.run(
      'UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStock, id]
    );

    // Registrar movimiento
    const movementType = quantity > 0 ? 'entrada' : 'salida';
    await db.run(
      `INSERT INTO stock_movements (product_id, type, quantity, reason)
       VALUES (?, ?, ?, ?)`,
      [id, movementType, Math.abs(quantity), reason || 'Ajuste manual']
    );

    const updatedProduct = await db.get('SELECT * FROM products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Stock ajustado exitosamente',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error al ajustar stock:', error);
    res.status(500).json({
      success: false,
      error: 'Error al ajustar stock'
    });
  }
});

module.exports = router;