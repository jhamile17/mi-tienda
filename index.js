const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const cors = require('cors');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const isAuthenticated = require('./middleware/auth');

const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.JWT_SECRET || "mi_secreto_ultra_seguro";

// Configuración de EJS + layouts
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(expressLayouts);
app.set('layout', 'layout');

// Archivos estáticos
app.use(express.static('public'));
app.use('/vendor/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist'));
app.use('/vendor/bootstrap-icons', express.static(__dirname + '/node_modules/bootstrap-icons'));

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(session({
  secret: '171614',
  resave: false,
  saveUninitialized: true
}));

// Middleware global: pasar datos a todas las vistas
app.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      res.locals.isAuthenticated = true;
      res.locals.user = decoded;
    } catch (err) {
      res.locals.isAuthenticated = false;
      res.locals.user = null;
    }
  } else {
    res.locals.isAuthenticated = false;
    res.locals.user = null;
  }

  res.locals.isLoginPage = req.path.startsWith('/login') || req.path.startsWith('/register');
  res.locals.title = "Cake Sweet";
  res.locals.error = null;
  res.locals.mensaje = null;
  next();
});

// Importar rutas
const catalogoRoutes = require('./routes/catalogo');  // Catálogo público
const loginRoutes = require('./routes/login');
const registerRoutes = require('./routes/register');
const homeRoutes = require('./routes/home');          // Dashboard privado
const productosRoutes = require('./routes/productos'); // CRUD productos
const categoriasRoutes = require('./routes/categorias');
const imagenesRoutes = require('./routes/imagenes');

// Redirigir raíz según autenticación
app.get('/', (req, res) => {
  if (res.locals.isAuthenticated) {
    return res.redirect('/home');
  } else {
    return res.redirect('/catalogo');
  }
});

// Rutas públicas
app.use('/catalogo', catalogoRoutes);
app.use('/login', loginRoutes);
app.use('/register', registerRoutes);

// Rutas privadas (requieren autenticación)
app.use('/home', isAuthenticated, homeRoutes);
app.use('/productos', isAuthenticated, productosRoutes);
app.use('/categorias', isAuthenticated, categoriasRoutes);
app.use('/imagenes', isAuthenticated, imagenesRoutes);

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).render('error', { 
    title: "Error 404",
    mensaje: 'Página no encontrada',
    error: null
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;
