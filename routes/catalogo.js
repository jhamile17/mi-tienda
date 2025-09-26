const express = require("express");
const pool = require("../db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const categoriaId = req.query.categoria || null;

    // Traer categorías
    const [categorias] = await pool.query("SELECT * FROM categorias");

    // Traer productos con su primera imagen
    let query = `
      SELECT p.id, p.nombre, p.precio, c.nombre AS categoria,
             (SELECT i.url FROM imagenes_productos i 
              WHERE i.producto_id = p.id 
              ORDER BY i.id ASC LIMIT 1) AS imagen
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
    `;
    const params = [];
    if (categoriaId) {
      query += " WHERE p.categoria_id = ?";
      params.push(categoriaId);
    }
    query += " ORDER BY p.nombre ASC";

    const [productos] = await pool.query(query, params);

    res.render("catalogo/index", {
      title: "Catálogo de Productos",
      categorias,
      productos,
      categoriaId
    });
  } catch (err) {
    console.error("Error al cargar catálogo:", err);
    res.render("catalogo/index", {
      title: "Catálogo de Productos",
      categorias: [],
      productos: [],
      categoriaId: null,
      error: "Error al cargar catálogo"
    });
  }
});

// 📌 Detalle de producto
router.get("/producto/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Traer producto
    const [rows] = await pool.query(
      `SELECT p.id, p.nombre, p.precio, c.nombre AS categoria
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).send("Producto no encontrado");
    }

    const producto = rows[0];

    // Traer imágenes
    const [imagenes] = await pool.query(
      "SELECT url FROM imagenes_productos WHERE producto_id = ?",
      [id]
    );

    res.render("catalogo/detalle", {
      title: `Detalle - ${producto.nombre}`,
      producto,
      imagenes
    });
  } catch (err) {
    console.error("Error al cargar detalle:", err);
    res.status(500).send("Error al cargar detalle del producto");
  }
});

module.exports = router;
