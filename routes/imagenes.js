const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de Multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const carpeta = 'public/imagenes/productos/';
    if (!fs.existsSync(carpeta)) fs.mkdirSync(carpeta, { recursive: true });
    cb(null, carpeta);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Obtener todas las categorías
async function obtenerCategorias() {
  const [categorias] = await db.query('SELECT * FROM categorias');
  return categorias;
}

// Redirigir /imagenes a /imagenes/nuevoi
router.get('/', (req, res) => {
  res.redirect('/imagenes/nuevoi');
});

// Renderizar formulario de imágenes
router.get('/nuevoi', async (req, res) => {
  try {
    const categorias = await obtenerCategorias();
    res.render('imagenes/nuevoi', { categorias, mensaje: null, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar formulario de imágenes');
  }
});

// Obtener productos por categoría (select dinámico)
router.get('/productos/byCategoria/:categoriaId', async (req, res) => {
  try {
    const { categoriaId } = req.params;
    const [productos] = await db.query(
      'SELECT id, nombre FROM productos WHERE categoria_id = ?',
      [categoriaId]
    );
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Guardar nueva imagen
router.post('/', upload.single('imagen'), async (req, res) => {
  try {
    const { producto_id } = req.body;
    const categorias = await obtenerCategorias();

    if (!req.file) {
      return res.render('imagenes/nuevoi', { categorias, error: 'No se subió ninguna imagen', mensaje: null });
    }

    const url = '/imagenes/productos/' + req.file.filename;
    await db.query('INSERT INTO imagenes_productos (url, producto_id) VALUES (?, ?)', [url, producto_id]);

    res.render('imagenes/nuevoi', { categorias, mensaje: 'Imagen agregada correctamente', error: null });
  } catch (err) {
    console.error(err);
    const categorias = await obtenerCategorias();
    res.render('imagenes/nuevoi', { categorias, error: err.message, mensaje: null });
  }
});

// Listar imágenes por producto
router.get('/list/:producto_id', async (req, res) => {
  try {
    const { producto_id } = req.params;
    const [imagenes] = await db.query(
      'SELECT * FROM imagenes_productos WHERE producto_id = ?',
      [producto_id]
    );
    res.json(imagenes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar imagen
router.put('/:id', upload.single('imagen'), async (req, res) => {
  try {
    const { id } = req.params;
    const categorias = await obtenerCategorias();

    if (!req.file) {
      return res.render('imagenes/nuevoi', { categorias, error: 'No se subió ninguna imagen', mensaje: null });
    }

    const url = '/imagenes/productos/' + req.file.filename;

    // Eliminar archivo anterior
    const [rows] = await db.query('SELECT url FROM imagenes_productos WHERE id = ?', [id]);
    if (rows.length) {
      const rutaAnterior = 'public' + rows[0].url;
      if (fs.existsSync(rutaAnterior)) fs.unlinkSync(rutaAnterior);
    }

    await db.query('UPDATE imagenes_productos SET url = ? WHERE id = ?', [url, id]);
    res.render('imagenes/nuevoi', { categorias, mensaje: 'Imagen actualizada correctamente', error: null });
  } catch (err) {
    console.error(err);
    const categorias = await obtenerCategorias();
    res.render('imagenes/nuevoi', { categorias, error: err.message, mensaje: null });
  }
});

// Eliminar imagen
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query('SELECT url FROM imagenes_productos WHERE id = ?', [id]);
    if (rows.length) {
      const rutaArchivo = 'public' + rows[0].url;
      if (fs.existsSync(rutaArchivo)) fs.unlinkSync(rutaArchivo);
    }

    await db.query('DELETE FROM imagenes_productos WHERE id = ?', [id]);
    res.json({ mensaje: 'Imagen eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
