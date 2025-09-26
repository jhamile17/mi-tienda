const express = require("express");
const pool = require("../db");
const router = express.Router();

// Catálogo
router.get("/", async (req, res) => {
  try {
    const categoriaId = req.query.categoria || null;
    const mensaje = req.query.mensaje || null;

    // Traer categorías
    const [categorias] = await pool.query("SELECT * FROM categorias");

    // Traer productos
    let query = `
      SELECT p.id, p.nombre, p.precio, c.nombre AS categoria,
             (SELECT i.url FROM imagenes_productos i WHERE i.producto_id = p.id ORDER BY i.id ASC LIMIT 1) AS imagen
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

    res.render("catalogo", {
      title: "Catálogo de Productos",
      categorias,
      productos,
      categoriaId,
      mensaje,   // 👈 lo recibe el layout
      error: null,
      isAuthenticated: !!req.user,
      user: req.user || null
    });
  } catch (err) {
    console.error(err);
    res.render("catalogo", {
      title: "Catálogo de Productos",
      categorias: [],
      productos: [],
      categoriaId: null,
      mensaje: null,
      error: "Error al cargar catálogo",
      isAuthenticated: !!req.user,
      user: req.user || null
    });
  }
});

module.exports = router;

