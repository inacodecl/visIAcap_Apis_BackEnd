# VisIAcap APIs Backend

API REST para el Totem VislAcap. Este proyecto proporciona los servicios backend necesarios para la aplicación, conectándose a una base de datos MySQL.

## Estructura del Proyecto

El proyecto sigue una arquitectura **MVC (Modelo - Vista - Controlador)** para organizar el código de manera lógica y escalable.

- **config/**: Configuración de la base de datos y otras variables globales.
- **controllers/**: Lógica de negocio y manejo de las peticiones.
- **routes/**: Definición de las rutas de la API.
- **models/**: Modelos de datos e interacción con la base de datos.
- **middlewares/**: Funciones intermedias para seguridad, logs, etc.
- **index.js**: Punto de entrada de la aplicación.

## Requisitos Previos

Asegúrate de tener instalado lo siguiente:

- [Node.js](https://nodejs.org/) 
- [MySQL](https://www.mysql.com/)

## Instalación

1.  Clona el repositorio.
    ```powershell
    git clone https://github.com/inacodecl/visIAcap_Apis_BackEnd.git
    ```

2.  Navega al directorio del proyecto:
    ```powershell
    cd VisIAcap_Apis_Backend
    ```

3.  Instala las dependencias:
    ```powershell
    npm install
    ```

## Configuración
config/db.js para producción

| Variable | Descripción | Valor por Defecto |
| :--- | :--- | :--- |
| `PORT` | Puerto donde correrá el servidor | `3000` |
| `DB_HOST` | Host de la base de datos MySQL | `localhost` |
| `DB_USER` | Usuario de la base de datos | `visiacap_user` |
| `DB_PASSWORD` | Contraseña de la base de datos | `VisIacap123#` |
| `DB_NAME` | Nombre de la base de datos | `visiacap` |

## Uso

Para iniciar el servidor:

```powershell
npm start
```

El servidor se iniciará por defecto en `http://localhost:3000`.

## API Endpoints

### Usuarios

-   **Listar Usuarios**
    -   **URL:** `/api/usuarios`
    -   **Método:** `GET`
    -   **Descripción:** Obtiene una lista de todos los usuarios.

## Tecnologías Utilizadas

-   **Express**: Framework web para Node.js.
-   **MySQL2**: Cliente para conectar con la base de datos MySQL.
-   **Cors**: Middleware para permitir peticiones cruzadas.
-   **Helmet**: Middleware para seguridad HTTP.
-   **Morgan**: Middleware para log de peticiones HTTP.
-   **Dotenv**: Carga de variables de entorno.

## Desarrolladores

-   Estudiantes Inacap Renca