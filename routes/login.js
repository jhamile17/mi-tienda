const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const crypto = require("crypto");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "mi_secreto_ultra_seguro";

// GET /login → formulario
router.get("/", (req, res) => {
  const mensaje = req.query.mensaje || null;
  res.render("login", {
    title: "Iniciar Sesión - Cake Sweet",
    error: null,
    mensaje,
    isLoginPage: true
  });
});

// POST /login → procesar login
router.post("/", async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const [usuarios] = await pool.query(
      "SELECT * FROM usuarios WHERE usuario = ?",
      [usuario]
    );

    if (usuarios.length === 0) {
      return res.render("login", {
        title: "Iniciar Sesión - Cake Sweet",
        error: "Usuario o contraseña incorrectos",
        mensaje: null,
        isLoginPage: true
      });
    }

    const user = usuarios[0];
    let passwordValida = false;

    // Verificar MD5
    const isMD5 = /^[a-f0-9]{32}$/i.test(user.password);
    if (isMD5) {
      const md5Hash = crypto.createHash("md5").update(password).digest("hex");
      passwordValida = md5Hash === user.password;

      if (passwordValida) {
        const bcryptHash = await bcrypt.hash(password, 10);
        await pool.query("UPDATE usuarios SET password = ? WHERE id = ?", [
          bcryptHash,
          user.id
        ]);
      }
    } else {
      passwordValida = await bcrypt.compare(password, user.password);
    }

    if (!passwordValida) {
      return res.render("login", {
        title: "Iniciar Sesión - Cake Sweet",
        error: "Usuario o contraseña incorrectos",
        mensaje: null,
        isLoginPage: true
      });
    }

    // Crear token JWT
    const token = jwt.sign(
      { id: user.id, usuario: user.usuario },
      SECRET_KEY,
      { expiresIn: "24h" }
    );

    // Guardar cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.redirect("/home");
  } catch (err) {
    console.error("Error en login:", err);
    res.render("login", {
      title: "Iniciar Sesión - Cake Sweet",
      error: "Error en el servidor",
      mensaje: null,
      isLoginPage: true
    });
  }
});
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/catalogo");
});

module.exports = router;
