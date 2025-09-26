const express = require("express");
const pool = require("../db"); // tu conexión MySQL
const router = express.Router();

// GET /catalogo → lista productos con filtro opcional por categoría
router.get("/", async (req, res) => {
  try {
    const categoriaId = req.query.categoria || "";

    // Obtener todas las categorías
    const [categorias] = await pool.query("SELECT id, nombre FROM categorias");

    let productos = [];
    if (categoriaId) {
      // Productos filtrados por categoría
      [productos] = await pool.query(
        `SELECT p.id, p.nombre, p.precio, c.nombre AS categoria,
                ip.url AS imagen
         FROM productos p
         LEFT JOIN categorias c ON p.categoria_id = c.id
         LEFT JOIN imagenes_productos ip ON ip.producto_id = p.id
         WHERE c.id = ?`,
        [categoriaId]
      );
    } else {
      // Todos los productos
      [productos] = await pool.query(
        `SELECT p.id, p.nombre, p.precio, c.nombre AS categoria,
                ip.url AS imagen
         FROM productos p
         LEFT JOIN categorias c ON p.categoria_id = c.id
         LEFT JOIN imagenes_productos ip ON ip.producto_id = p.id`
      );
    }

    res.render("catalogo/index", {
      layout: "layout",
      title: "Catálogo de Productos",
      categorias,
      productos,
      categoriaId
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("error", {
      title: "Error al cargar catálogo",
      mensaje: "Ha ocurrido un error al cargar el catálogo."
    });
  }
});

// GET /catalogo/:id → detalle de un producto con imágenes
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener producto
    const [[producto]] = await pool.query(
      `SELECT p.id, p.nombre, p.precio, c.nombre AS categoria
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    if (!producto) {
      return res.status(404).render("error", {
        title: "Producto no encontrado",
        mensaje: "El producto que buscas no existe."
      });
    }

    // Obtener imágenes del producto
    const [imagenes] = await pool.query(
      `SELECT * FROM imagenes_productos WHERE producto_id = ?`,
      [id]
    );

    res.render("catalogo/detalle", {
      layout: "layout",
      title: producto.nombre,
      producto,
      imagenes  // <-- PASAMOS las imágenes a la vista
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("error", {
      title: "Error al cargar producto",
      mensaje: "Ha ocurrido un error al cargar el producto."
    });
  }
});

module.exports = router;
