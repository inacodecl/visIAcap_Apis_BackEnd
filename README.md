# Inacap Renca Smart (Backend)

Este es el backend para el proyecto "Inacap Renca Smart", diseñado para proveer servicios a la aplicación Ionic (Totem Interactivo). Está construido con Node.js, Express y MySQL.

## Tecnologías Utilizadas

- **Node.js** & **Express**: Servidor principal.
- **MySQL**: Base de datos relacional.
- **JWT (JSON Web Tokens)**: Autenticación segura.
- **Bcrypt**: Encriptación de contraseñas.
- **Dotenv**: Gestión de variables de entorno.

## Requisitos Previos

- Node.js (v18 o superior)
- MySQL Server corriendo localmente o remoto.

## Instalación y Configuración

1.  **Clonar el repositorio** (si no lo has hecho ya):
    ```bash
    git clone <url-del-repo>
    cd VisIAcap_Apis_Backend
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**:
    - Copia el archivo de ejemplo:
      ```bash
      cp .env.example .env
      ```
    - Abre `.env` y configura tus credenciales de base de datos (`DB_USER`, `DB_PASSWORD`, `DB_NAME`).

4.  **Ejecutar el Servidor**:
    - Modo desarrollo (con recarga automática):
      ```bash
      npm run dev
      ```
    - Modo producción:
      ```bash
      npm start
      ```

## Documentación de API

### Autenticación `POST /api/auth/login`
- **Body**: `{ "email": "admin@inacap.cl", "password": "pass" }`
- **Response**: Token JWT.

### Historia (Línea de Tiempo)

- **GET /api/history**: Lista pública. `?lang=es`.
- **GET /api/history/:id**: Detalle de hito.
- **POST /api/history** (Admin):
  ```json
  {
    "anio": 1966,
    "titulo": "Fundación",
    "descripcion": "Se funda Inacap...",
    "visible": true,
    "locale": "es"
  }
  ```
- **PUT /api/history/:id** (Admin): Reemplazo total del recurso.
- **PATCH /api/history/:id** (Admin): Actualización parcial.
  ```json
  {
    "visible": false,
    "titulo": "Nuevo Título Corregido"
  }
  ```
- **DELETE /api/history/:id** (Admin): Eliminación física.

### Usuarios (Gestión)

- **GET /api/usuarios** (Admin): Lista paginada. `?page=1&limit=10&rol=admin`.
- **POST /api/usuarios** (SuperAdmin):
  ```json
  {
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@inacap.cl",
    "password": "securePass123",
    "rol": "editor"
  }
  ```

  ```
- **PATCH /api/usuarios/:id** (SuperAdmin):
  ```json
  {
    "rol": "admin",
    "is_active": 0
  }
  ```

### Entrevistas (Gestión Multimedia)

- **GET /api/entrevistas**: Lista pública (solo visibles).
- **GET /api/entrevistas/all** (Admin): Lista completa.
- **POST /api/entrevistas** (Admin):
  ```json
  {
    "titulo": "Nueva Entrevista",
    "entrevistado": "Maria Soto",
    "descripcion": "Descripción opcional",
    "url_video": "https://youtube.com/...",
    "url_imagen": "assets/img/tbn.jpg",
    "fecha_grabacion": "2023-12-01",
    "visible": true
  }
  ```
- **PUT /api/entrevistas/:id** (Admin): Actualización total.
- **PATCH /api/entrevistas/:id** (Admin): Actualización parcial.
- **DELETE /api/entrevistas/:id** (Admin): Eliminar entrevista.

## Estructura del Proyecto

- `config/`: Configuración de base de datos.
- `controllers/`: Lógica de negocio de cada módulo.
- `middlewares/`: Validaciones de JWT y Roles.
- `models/`: Modelos de datos (Referencia).
- `routes/`: Definición de endpoints.
