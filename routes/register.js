const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');

router.get('/', (req, res) => {
  res.render('register', { error: null });
});

router.post('/', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar datos de entrada
    if (!username || !password) {
      return res.render('register', { error: 'Usuario y contraseña son requeridos' });
    }

    if (username.length < 3) {
      return res.render('register', { error: 'El usuario debe tener al menos 3 caracteres' });
    }

    if (password.length < 4) {
      return res.render('register', { error: 'La contraseña debe tener al menos 4 caracteres' });
    }

    // Verificar si el usuario ya existe
    const [existingUsers] = await pool.query(
      'SELECT * FROM usuarios WHERE usuario = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.render('register', { error: 'El usuario ya existe' });
    }

    // Encriptar la contraseña con bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Registrando nuevo usuario:', username);

    // Insertar nuevo usuario
    await pool.query(
      'INSERT INTO usuarios (usuario, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    console.log('Usuario registrado exitosamente:', username);
    res.redirect('/login?mensaje=Usuario registrado exitosamente');
  } catch (error) {
    console.error('Error en registro:', error);
    res.render('register', { error: 'Error al registrar el usuario' });
  }
});

module.exports = router;