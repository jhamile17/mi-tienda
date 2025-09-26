const express = require("express");
const pool = require("../db");
const router = express.Router();

// GET /home → dashboard
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, usuario FROM usuarios WHERE id = ?",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.redirect("/login?mensaje=Usuario no encontrado");
    }

    const usuario = rows[0];

    res.render("home", {
      title: "Dashboard - Cake Sweet",
      usuario,
      error: null,
      mensaje: null
    });
  } catch (err) {
    console.error(err);
    res.redirect("/login?mensaje=Error en el servidor");
  }
});

module.exports = router;
