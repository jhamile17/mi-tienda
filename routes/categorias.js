const express = require('express');
const router = express.Router();
const db = require('../db');

// Función para obtener todas las categorías
async function obtenerCategorias() {
  const [categorias] = await db.query('SELECT * FROM categorias');
  return categorias;
}

// Vista principal: lista de categorías
router.get('/', async (req, res) => {
  const mensaje = req.query.mensaje || null;
  const error = req.query.error || null;

  try {
    const categorias = await obtenerCategorias();
    res.render('categorias/index', { categorias, mensaje, error });
  } catch (err) {
    res.redirect('/categorias?error=Error cargando categorías');
  }
});

// Formulario para agregar nueva categoría
router.get('/nuevo', async (req, res) => {
  try {
    res.render('categorias/nuevo');
  } catch (err) {
    res.status(500).send('Error cargando formulario: ' + err.message);
  }
});

// Guardar nueva categoría
router.post('/', async (req, res) => {
  const { nombre } = req.body;
  try {
    await db.query('INSERT INTO categorias (nombre) VALUES (?)', [nombre]);
    res.redirect('/categorias?mensaje=Categoría agregada correctamente');
  } catch (err) {
    res.redirect('/categorias?error=Error al guardar categoría');
  }
});

// Formulario para editar categoría
router.get('/:id/editar', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM categorias WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).send('Categoría no encontrada');
    res.render('categorias/editar', { categoria: rows[0] });
  } catch (err) {
    res.status(500).send('Error cargando categoría: ' + err.message);
  }
});

// Actualizar categoría
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  try {
    await db.query('UPDATE categorias SET nombre = ? WHERE id = ?', [nombre, id]);
    res.redirect('/categorias?mensaje=Categoría actualizada correctamente');
  } catch (err) {
    res.redirect('/categorias?error=Error al actualizar categoría');
  }
});

// Eliminar categoría
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM categorias WHERE id = ?', [id]);
    res.redirect('/categorias?mensaje=Categoría eliminada correctamente');
  } catch (err) {
    res.redirect('/categorias?error=Error al eliminar categoría');
  }
});

// Redirigir a productos de la categoría
router.get('/:id/productos', (req, res) => {
  const { id } = req.params;
  res.redirect(`/productos?categoria=${id}`);
});

module.exports = router;
