# Inacap Renca Smart (Backend)

Backend del proyecto "Inacap Renca Smart" para el Totem Interactivo. Construido con Node.js, Express y MySQL.

## Arquitectura (Refactorización MVC)

Este proyecto ha sido refactorizado (v2.0) siguiendo una arquitectura **MVC (Modelo-Vista-Controlador)** estricta para garantizar escalabilidad y mantenibilidad.

### Estructura de Directorios

- **`/models`**: Contiene TODA la lógica de acceso a datos (Queries SQL). Los nombres de archivos corresponden al plural de la entidad principal.
  - `usuarios.model.js` (Tabla: usuarios)
  - `historias.model.js` (Tabla: historia, historia_i18n)
  - `entrevistas.model.js` (Tabla: entrevistas)
- **`/controllers`**: Maneja la lógica HTTP (req/res), valida datos básicos y orquesta llamadas a los modelos. NO contiene SQL.
  - `usuarios.controller.js`
  - `historias.controller.js`
  - `entrevistas.controller.js`
- **`/middlewares`**: Capa intermedia para utilidades transversales.
  - `auth.middleware.js`: Verificación de JWT y RBAC (Roles).
  - `validation.middleware.js`: Validación automática de campos requeridos.
- **`/routes`**: Definición de endpoints REST.
- **`/config`**: Configuración de conexión a BD.

## Tecnologías Utilizadas

- **Node.js** & **Express**
- **MySQL** (Driver mysql2/promise)
- **JWT** (Seguridad) & **Bcrypt** (Hashing)

## Endpoints Principales

### Historia (Timeline)
- `GET /api/history`: Listado público.
- `GET /api/history/:id`: Detalle.
- `POST /api/history` (Auth): Crear hito.
- `PUT /api/history/:id` (Auth): Actualizar hito.

### Entrevistas
- `GET /api/entrevistas`: Listado público.
- `POST /api/entrevistas` (Auth): Crear entrevista.

### Usuarios
- `GET /api/usuarios` (Admin): Gestión de usuarios.
- `POST /api/usuarios` (SuperAdmin): Crear usuarios.

## Scripts

- `npm install`: Instalar dependencias.
- `npm run dev`: Servidor en modo desarrollo (nodemon).
- `npm start`: Servidor en producción.
