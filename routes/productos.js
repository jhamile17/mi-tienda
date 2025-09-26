const express = require('express');
const router = express.Router();
const db = require('../db');


// LISTA PRODUCTO
router.get('/', async (req, res) => {
  try {
    const categoriaId = req.query.categoria || null;

    // Traer todas las categorías
    const [categorias] = await db.query('SELECT * FROM categorias');

    // Consulta principal de productos con primera imagen
    let query = `
      SELECT p.id, p.nombre, p.precio, c.nombre AS categoria,
             (SELECT i.url FROM imagenes_productos i WHERE i.producto_id = p.id ORDER BY i.id ASC LIMIT 1) AS imagen
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
    `;
    const params = [];

    if (categoriaId) {
      query += ' WHERE p.categoria_id = ?';
      params.push(categoriaId);
    }

    query += ' ORDER BY p.nombre ASC';

    const [productos] = await db.query(query, params);

    res.render('productos/indexp', { productos, categorias, categoriaId });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al obtener productos', error: err });
  }
});

router.get('/nuevop', async (req, res) => {
  try {
    const [categorias] = await db.query('SELECT * FROM categorias');

    // Traer productos para la tabla
    const [productos] = await db.query(`
      SELECT p.id, p.nombre, p.precio, c.nombre AS categoria
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ORDER BY p.id ASC
    `);

    res.render('productos/nuevop', { categorias, productos });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al cargar formulario', error: err });
  }
});

// ====== CREAR PRODUCTO ======
router.post('/', async (req, res) => {
  const { nombre, precio, categoria_id } = req.body;

  // Validación
  if (!nombre || !precio || !categoria_id) {
    return res.status(400).render('error', { mensaje: 'Todos los campos son obligatorios.' });
  }
  if (isNaN(precio)) {
    return res.status(400).render('error', { mensaje: 'El precio debe ser un número.' });
  }

  try {
    await db.query('INSERT INTO productos (nombre, precio, categoria_id) VALUES (?, ?, ?)', [nombre, precio, categoria_id]);
    res.redirect('/productos');
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al crear producto', error: err });
  }
});

// ====== DETALLE DE PRODUCTO ======
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [producto] = await db.query(`
      SELECT p.id, p.nombre, p.precio, c.nombre AS categoria
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (producto.length === 0) return res.status(404).render('error', { mensaje: 'Producto no encontrado' });

    const [imagenes] = await db.query('SELECT url FROM imagenes_productos WHERE producto_id = ?', [id]);

    res.render('productos/detalle', { producto: producto[0], imagenes });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al cargar detalle', error: err });
  }
});

// ====== FORMULARIO EDITAR PRODUCTO ======
router.get('/:id/edit', async (req, res) => {
  const { id } = req.params;
  try {
    const [producto] = await db.query('SELECT * FROM productos WHERE id = ?', [id]);
    if (producto.length === 0) return res.status(404).render('error', { mensaje: 'Producto no encontrado' });

    const [categorias] = await db.query('SELECT * FROM categorias');

    res.render('productos/editarp', { producto: producto[0], categorias });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al cargar producto', error: err });
  }
});

// ====== ACTUALIZAR PRODUCTO ======
router.post('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, categoria_id } = req.body;

  if (!nombre || !precio || !categoria_id) {
    return res.status(400).render('error', { mensaje: 'Todos los campos son obligatorios.' });
  }
  if (isNaN(precio)) {
    return res.status(400).render('error', { mensaje: 'El precio debe ser un número.' });
  }

  try {
    await db.query('UPDATE productos SET nombre = ?, precio = ?, categoria_id = ? WHERE id = ?', [nombre, precio, categoria_id, id]);
    res.redirect('/productos');
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al actualizar producto', error: err });
  }
});

// ====== ELIMINAR PRODUCTO ======
router.post('/:id/delete', async (req, res) => {
  const { id } = req.params;
  try {
    // Borrar imágenes asociadas primero
    await db.query('DELETE FROM imagenes_productos WHERE producto_id = ?', [id]);
    await db.query('DELETE FROM productos WHERE id = ?', [id]);
    res.redirect('/productos');
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al eliminar producto', error: err });
  }
});
// Obtener productos por categoría
router.get('/byCategoria/:categoriaId', async (req, res) => {
  const { categoriaId } = req.params;
  try {
    const [productos] = await db.query(
      'SELECT id, nombre FROM productos WHERE categoria_id = ? ORDER BY nombre ASC',
      [categoriaId]
    );
    res.json(productos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});


module.exports = router;
