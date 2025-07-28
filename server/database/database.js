const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'inventory.db');

class Database {
  constructor() {
    this.db = null;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error al conectar con la base de datos:', err);
          reject(err);
        } else {
          console.log('✅ Conectado a la base de datos SQLite');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    const tables = [
      // Tabla de productos
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        cost REAL NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 0,
        category TEXT,
        barcode TEXT UNIQUE,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de ventas
      `CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total REAL NOT NULL,
        payment_method TEXT DEFAULT 'efectivo',
        customer_name TEXT,
        customer_phone TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de items de venta
      `CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id)
      )`,

      // Tabla de movimientos de stock
      `CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('entrada', 'salida', 'ajuste')),
        quantity INTEGER NOT NULL,
        reason TEXT,
        reference_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id)
      )`,

      // Índices para optimización
      `CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`,
      `CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`,
      `CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id)`,
      `CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at)`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    // Insertar datos de ejemplo si no existen productos
    const count = await this.get('SELECT COUNT(*) as count FROM products');
    if (count.count === 0) {
      await this.insertSampleData();
    }

    console.log('✅ Tablas de base de datos creadas/verificadas');
  }

  async insertSampleData() {
    const sampleProducts = [
      {
        name: 'Coca Cola 500ml',
        description: 'Bebida gaseosa sabor cola',
        price: 2.50,
        cost: 1.20,
        stock: 50,
        min_stock: 10,
        category: 'Bebidas',
        barcode: '7501055363057'
      },
      {
        name: 'Pan Integral',
        description: 'Pan de molde integral 680g',
        price: 3.80,
        cost: 2.10,
        stock: 25,
        min_stock: 5,
        category: 'Panadería',
        barcode: '7501000673285'
      },
      {
        name: 'Leche Entera 1L',
        description: 'Leche entera pasteurizada',
        price: 1.95,
        cost: 1.40,
        stock: 30,
        min_stock: 8,
        category: 'Lácteos',
        barcode: '7501020425871'
      },
      {
        name: 'Arroz Blanco 1kg',
        description: 'Arroz grano largo premium',
        price: 2.20,
        cost: 1.50,
        stock: 40,
        min_stock: 10,
        category: 'Granos',
        barcode: '7501030485729'
      }
    ];

    for (const product of sampleProducts) {
      await this.run(
        `INSERT INTO products (name, description, price, cost, stock, min_stock, category, barcode)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [product.name, product.description, product.price, product.cost, 
         product.stock, product.min_stock, product.category, product.barcode]
      );
    }

    console.log('✅ Datos de ejemplo insertados');
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) {
          console.error('Error al cerrar la base de datos:', err);
        } else {
          console.log('Base de datos cerrada');
        }
        resolve();
      });
    });
  }
}

module.exports = new Database();