# Kanban API

API RESTful estilo Kanban para gestión de tareas con tableros, columnas y tickets.

## Características

- Jerarquía de tres niveles: Board (Tablero) → Column (Columna) → Ticket (Tarea)
- Cada tablero se crea automáticamente con 3 columnas básicas: "Qué hacer", "Haciendo", "Hecho"
- Movimiento de tickets entre columnas mediante PATCH
- Borrado en cascada (al eliminar un tablero, se eliminan sus columnas y tickets)
- Validación de ObjectId antes de consultar MongoDB
- Aislamiento de rutas (no revela existencia de recursos en otros tableros)
- Operaciones idempotentes en actualizaciones
- Manejo centralizado de errores

## Stack Tecnológico

- **Node.js**: 20.x (CommonJS)
- **Express**: 4.x
- **MongoDB**: Latest stable version
- **Mongoose**: 8.x
- **dotenv**: Gestión de variables de entorno
- **cors**: Soporte para CORS

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno (copiar `.env.example` a `.env`):
```bash
cp .env.example .env
```

4. Configurar la URI de MongoDB en `.env`:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/kanban
```

5. Iniciar el servidor:
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| PORT | Puerto del servidor | 3000 |
| MONGODB_URI | URI de conexión a MongoDB | mongodb://localhost:27017/kanban |

## Tabla de Endpoints

### Boards

| Método | Ruta | Descripción | Código Éxito |
|--------|------|-------------|--------------|
| POST | `/api/boards` | Crear tablero | 201 |
| GET | `/api/boards` | Listar tableros | 200 |
| GET | `/api/boards/:boardId` | Obtener tablero con columnas | 200 |
| PATCH | `/api/boards/:boardId` | Actualizar tablero | 200 |
| DELETE | `/api/boards/:boardId` | Eliminar tablero (cascada) | 204 |

### Columns

| Método | Ruta | Descripción | Código Éxito |
|--------|------|-------------|--------------|
| GET | `/api/boards/:boardId/columns` | Listar columnas del tablero | 200 |
| POST | `/api/boards/:boardId/columns` | Crear columna en tablero | 201 |
| GET | `/api/boards/:boardId/columns/:columnId` | Obtener columna específica | 200 |
| PATCH | `/api/boards/:boardId/columns/:columnId` | Actualizar columna | 200 |
| DELETE | `/api/boards/:boardId/columns/:columnId` | Eliminar columna (cascada) | 204 |

### Tickets

| Método | Ruta | Descripción | Código Éxito |
|--------|------|-------------|--------------|
| GET | `/api/boards/:boardId/columns/:columnId/tickets` | Listar tickets de columna | 200 |
| POST | `/api/boards/:boardId/columns/:columnId/tickets` | Crear ticket en columna | 201 |
| GET | `/api/boards/:boardId/columns/:columnId/tickets/:ticketId` | Obtener ticket específico | 200 |
| PATCH | `/api/boards/:boardId/columns/:columnId/tickets/:ticketId` | Mover o actualizar ticket | 200 |
| DELETE | `/api/boards/:boardId/columns/:columnId/tickets/:ticketId` | Eliminar ticket | 204 |

## Ejemplo de Uso: Mover un Ticket

Para mover un ticket de una columna a otra:

```bash
PATCH /api/boards/{{boardId}}/columns/{{columnIdOrigen}}/tickets/{{ticketId}}
Content-Type: application/json

{
  "columnId": "{{columnIdDestino}}"
}
```

Respuesta exitosa (200):
```json
{
  "_id": "ticketId",
  "title": "Ticket de prueba",
  "description": "Descripción",
  "column": "columnIdDestino",
  "board": "boardId",
  "position": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Idempotencia**: Si envías el mismo PATCH múltiples veces, el resultado es el mismo. El ticket permanece en la columna destino sin duplicar datos ni corromper el orden.

## Códigos de Error

| Código | Descripción | Ejemplo |
|--------|-------------|---------|
| 400 | Payload inválido | Campo requerido faltante, tipo incorrecto |
| 400 | ID con formato inválido | No es hexadecimal de 24 caracteres |
| 400 | JSON malformado | Sintaxis JSON incorrecta en el body |
| 400 | Campo vacío | Título vacío cuando se requiere |
| 400 | Columna de otro tablero | Intento de mover a columna de otro tablero |
| 400 | PATCH sin campos válidos | Body vacío o sin campos permitidos |
| 404 | Recurso no encontrado | ID válido pero inexistente en BD |
| 404 | Columna de otro tablero | No revela que existe en otro tablero |
| 404 | Ruta inexistente | Endpoint no implementado |
| 409 | Duplicado | Campo único repetido |
| 500 | Error interno | Solo para errores no controlados |

Todas las respuestas de error tienen el formato:
```json
{
  "error": "Mensaje de error en español"
}
```

## Pruebas con Postman

1. Importar la colección `postman/kanban.postman_collection.json` en Postman
2. Configurar la variable `baseUrl` en `http://localhost:3000`
3. Ejecutar los requests en orden o usar el Collection Runner
4. Los scripts de test guardan automáticamente los IDs (boardId, columnId, ticketId) en variables

**Casos de prueba cubiertos**:
- ✅ Crear tablero (201) y guardar IDs de 3 columnas
- ✅ Crear tablero sin nombre (400)
- ✅ Obtener tablero con columnas (200)
- ✅ Agregar columna (201)
- ✅ Crear ticket (201)
- ✅ Ticket sin título (400)
- ✅ Mover ticket a "Haciendo" (200)
- ✅ Repetir PATCH (idempotencia - 200)
- ✅ Mover a "Hecho" (200)
- ✅ PATCH con título vacío (400)
- ✅ PATCH sin campos (400)
- ✅ ID con formato inválido (400)
- ✅ Tablero inexistente con ObjectId válido (404)
- ✅ Columna inexistente al crear ticket (404)
- ✅ Listar tableros (200)
- ✅ Eliminar columna (204)
- ✅ Eliminar tablero con cascada (204)
- ✅ Verificar tablero eliminado (404)

## Estructura de Carpetas

```
src/
├── models/           # Esquemas Mongoose
│   ├── Board.js
│   ├── Column.js
│   └── Ticket.js
├── controllers/      # Lógica de request/response
│   ├── boardController.js
│   ├── columnController.js
│   └── ticketController.js
├── routes/           # Declaración de rutas
│   ├── boardRoutes.js
│   ├── columnRoutes.js
│   └── ticketRoutes.js
├── middlewares/      # Validación y error handling
│   ├── errorHandler.js
│   ├── validateObjectId.js
│   ├── loadBoard.js
│   └── loadColumn.js
├── services/         # Helpers comunes
│   └── entityManager.js
├── errors/           # Clases de error personalizadas
│   └── ApiError.js
├── config/           # Configuración
│   └── db.js
├── app.js            # Configuración de Express
└── server.js         # Punto de entrada
```

## Guía de Despliegue (Render + MongoDB Atlas)

### MongoDB Atlas

1. Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crear un cluster (gratis: M0 Sandbox)
3. Configurar Network Access: permitir acceso desde cualquier IP (0.0.0.0/0)
4. Crear Database User con usuario y contraseña
5. Obtener la URI de conexión: `mongodb+srv://usuario:contraseña@cluster.mongodb.net/kanban`

### Render

1. Crear cuenta en [Render](https://render.com)
2. Crear nuevo Web Service
3. Conectar al repositorio Git
4. Configurar:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `PORT`: (dejar vacío, Render asigna uno)
     - `MONGODB_URI`: (pegar la URI de MongoDB Atlas)
5. Deploy

### Verificación

1. Una vez deployado, probar el health check:
```bash
curl https://tu-app.onrender.com/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

2. Importar la colección Postman, cambiar `baseUrl` a la URL de Render y ejecutar las pruebas.

## Patrones de Diseño

- **Responsabilidad Única**: Models, Controllers y Routes en archivos separados
- **Gestor Global de Entidades**: `entityManager.js` con helpers comunes (findOrFail, pick, nextPosition, asyncHandler)
- **Módulo Único de Errores**: `ApiError.js` + `errorHandler.js` centralizado
- **Validación en Capas**: Middleware validateObjectId antes de consultar MongoDB
- **Parent Check**: loadBoard y loadColumn para validar existencia y pertenencia
- **Aislamiento de Rutas**: No revela existencia de recursos en otros tableros

## Licencia

ISC
