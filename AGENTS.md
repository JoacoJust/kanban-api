# Desarrollo Basado en Especificaciones (SDD) - API Kanban

## Contexto y Jerarquía del Dominio

API RESTful estilo Kanban con jerarquía Padre-Hijo-Nieto:
- **Board (Tablero)**: Entidad padre del sistema
- **Column (Columna)**: Hija de Board, contiene tickets
- **Ticket (Tarea)**: Hija de Column, representa tareas individuales

**Reglas de negocio**:
- Cada tablero nace con 3 columnas básicas, en este orden: "Qué hacer", "Haciendo", "Hecho"
- Cada ticket vive en una columna
- Cuando se toma la tarea, cambia de padre a "Haciendo"
- Cuando se termina, cambia a "Hecho"
- El movimiento se hace con PATCH a `/api/boards/:boardId/columns/:columnId/tickets/:ticketId` con body `{ "columnId": "<columna destino>" }`
- NO hay gestión de usuarios ni autenticación

## Stack Estricto

- **Node.js**: 20.x (CommonJS)
- **Express**: 4.x
- **MongoDB**: Latest stable version
- **Mongoose**: 8.x
- **dotenv**: Para variables de entorno
- **cors**: Para CORS
- **Pruebas**: Postman

## Patrones de Diseño

### Responsabilidad Única
- **models/**: Solo esquemas Mongoose y lógica de datos
- **controllers/**: Solo lógica de request/response
- **routes/**: Solo declaración de rutas y encadenamiento de middlewares
- **middlewares/**: Validación y error handling
- **PROHIBIDA**: Lógica de base de datos en archivos de rutas

### Gestor Global de Entidades
Archivo: `src/services/entityManager.js`
Helpers comunes para evitar repetición:
- `findOrFail`: Busca entidad y lanza ApiError si no existe
- `pick`: Filtra campos permitidos (lista blanca)
- `nextPosition`: Calcula la siguiente posición
- `asyncHandler`: Wrapper para handlers async

### Módulo Único de Errores
- `src/errors/ApiError.js`: Clase personalizada de error
- `src/middlewares/errorHandler.js`: ÚNICO módulo que envía respuestas de error

## Manejo de Errores Global

Toda falla responde con formato: `{ "error": "mensaje en español" }`

### Códigos de Error
- **400 Bad Request**:
  - Payload inválido (campo requerido faltante, tipo incorrecto)
  - ID con formato inválido (no es hexadecimal de 24 caracteres)
  - JSON malformado
  - Campo vacío cuando se requiere
  - Columna pertenece a otro tablero (aislamiento de rutas)
  - PATCH sin campos válidos
  - Operación relativa prohibida
- **404 Not Found**:
  - ID válido pero inexistente en BD
  - Columna de otro tablero (no revelar que existe)
  - Ruta inexistente
  - Recurso padre no existe
- **409 Conflict**:
  - Duplicado (código 11000 de MongoDB)
- **500 Internal Server Error**:
  - Solo para errores no controlados
  - NO filtrar detalles sensibles al cliente
  - Loguear en consola para debugging

## Límites Negativos (Qué NO Hacer)

❌ **NO usar arrays simples** para anidar tickets en columnas (usar referencias ObjectId)
❌ **NO devolver 500** si boardId o columnId no existen (retornar 404)
❌ **NO devolver 500** por ID mal formado (retornar 400)
❌ **NO usar findByIdAndDelete** ni deleteOne de query sin disparar hooks
   - Usar `document.deleteOne()` con `pre('deleteOne', { document: true, query: false })` para borrado en cascada
❌ **NO mezclar lógica de BD en rutas** (models solo en controllers)
❌ **NO rutas planas** para crear tickets (ej. `/api/tickets` prohibido)
❌ **NO aceptar campos arbitrarios** del body (lista blanca con pick)
❌ **NO usar $push, $inc** ni operaciones relativas en PATCH de tickets
❌ **NO implementar autenticación** (fuera de alcance)
❌ **NO duplicar estructuras** de error handling (usar errorHandler global)

## Tabla de Endpoints (Contrato)

### Boards
| Método | Ruta | Acción | Código Éxito |
|--------|------|--------|--------------|
| POST | `/api/boards` | Crear tablero | 201 |
| GET | `/api/boards` | Listar tableros | 200 |
| GET | `/api/boards/:boardId` | Obtener tablero con columnas | 200 |
| PATCH | `/api/boards/:boardId` | Actualizar tablero | 200 |
| DELETE | `/api/boards/:boardId` | Eliminar tablero (cascada) | 204 |

### Columns
| Método | Ruta | Acción | Código Éxito |
|--------|------|--------|--------------|
| GET | `/api/boards/:boardId/columns` | Listar columnas del tablero | 200 |
| POST | `/api/boards/:boardId/columns` | Crear columna en tablero | 201 |
| GET | `/api/boards/:boardId/columns/:columnId` | Obtener columna específica | 200 |
| PATCH | `/api/boards/:boardId/columns/:columnId` | Actualizar columna | 200 |
| DELETE | `/api/boards/:boardId/columns/:columnId` | Eliminar columna (cascada) | 204 |

### Tickets
| Método | Ruta | Acción | Código Éxito |
|--------|------|--------|--------------|
| GET | `/api/boards/:boardId/columns/:columnId/tickets` | Listar tickets de columna | 200 |
| POST | `/api/boards/:boardId/columns/:columnId/tickets` | Crear ticket en columna | 201 |
| GET | `/api/boards/:boardId/columns/:columnId/tickets/:ticketId` | Obtener ticket específico | 200 |
| PATCH | `/api/boards/:boardId/columns/:columnId/tickets/:ticketId` | Mover o actualizar ticket | 200 |
| DELETE | `/api/boards/:boardId/columns/:columnId/tickets/:ticketId` | Eliminar ticket | 204 |

## Especificación de Modelos (Fase 1)

### Board
- `name`: String, requerido, trim, longitud 1-100
- `description`: String, trim, máximo 500
- Virtual `columns`: populate de Column.board
- Timestamps automáticos
- Exportar `DEFAULT_COLUMNS = ["Qué hacer", "Haciendo", "Hecho"]`
- Hook `pre('deleteOne', { document: true, query: false })`:
  - Elimina columnas UNA A UNA con `column.deleteOne()` (para disparar sus hooks)
  - Luego `deleteMany` de tickets del tablero como red de seguridad

### Column
- `name`: String, requerido, trim, longitud 1-100
- `board`: ObjectId ref Board, requerido, indexado
- `position`: Number, >= 0
- Virtual `tickets`: populate de Ticket.column
- Hook `pre('deleteOne', { document: true, query: false })`:
  - Elimina todos sus tickets

### Ticket
- `title`: String, REQUERIDO, trim, longitud 1-200
- `description`: String, trim, máximo 2000
- `column`: ObjectId ref Column, requerido, indexado
- `board`: ObjectId ref Board, requerido, indexado
- `position`: Number, >= 0
- Índice compuesto: `{ column: 1, position: 1 }`
- Timestamps automáticos

**Configuración común**:
- `id: false` en todos los esquemas
- `toJSON` sin `__v`
- Mensajes de validación en español

## Reglas de Validación y Negocio (Fase 2)

### Middlewares
1. **errorHandler**:
   - Convierte a `{ error }` los errores de ApiError
   - JSON malformado (`entity.parse.failed`) -> 400
   - ValidationError -> 400 (mensajes unidos)
   - CastError -> 400
   - Código 11000 (duplicado) -> 409
   - Cualquier otro -> 500 genérico (loguear en consola)
   - Middleware `notFound` para rutas inexistentes -> 404

2. **validateObjectId(...params)**:
   - Valida con regex `/^[0-9a-fA-F]{24}$/`
   - Si falla -> 400 inmediato
   - Nunca debe llegar a Mongoose con ID inválido

3. **loadBoard** (Parent Check nivel 1):
   - Busca el tablero por ID
   - Si no existe -> 404 inmediato (jamás 500)
   - Guarda en `req.board`

4. **loadColumn** (Parent Check nivel 2 + AISLAMIENTO DE RUTAS):
   - Busca la columna por ID
   - Si no existe -> 404
   - Si `column.board` no coincide con `req.board._id` -> 404 (no revelar que existe en otro tablero)
   - Guarda en `req.column`

**Wrapper**: Todos los handlers async deben estar envueltos en `asyncHandler`

## Controladores (Fase 3)

### Reglas por Endpoint

**POST /boards**:
- Lista blanca: `name`, `description`
- Crea el tablero
- Luego crea las 3 columnas básicas con `insertMany`
- Si falla la creación de columnas, borra el tablero
- Responde 201 con el tablero y columnas pobladas

**GET /boards/:boardId**:
- Tablero con columnas y sus tickets poblados
- Ordenados por `position` y `createdAt`

**POST columns**:
- Lista blanca: `name`, `position`
- Si falta `position`, asignar al final (`countDocuments`)
- Responde 201

**DELETE column**:
- Usar `document.deleteOne()` para disparar cascada
- Responde 204

**POST tickets**:
- Lista blanca: `title`, `description`, `position`
- El ticket guarda `column` y `board` tomados de `req.column` y `req.board` (nunca del body)
- Sin `title` -> 400
- Responde 201

**PATCH ticket (idempotente)**:
- a) Buscar el ticket por `_id` y `board`; si no existe -> 404
- b) Lista blanca: `title`, `description`, `position`, `columnId`; si no hay ningún campo -> 400
- c) Si viene `columnId`:
   - Validar formato -> 400
   - Que exista -> 404
   - Que pertenezca al MISMO tablero -> 400
- d) El ticket debe estar en la columna de la URL o ya en la columna destino (caso de reintento por fallo de red); si no -> 404
- e) Si es un movimiento real y no viene `position`, asignar el final de la columna destino (solo en el primer movimiento)
- f) Actualizar con `findOneAndUpdate({ _id, board }, { $set: valoresAbsolutos }, { new: true, runValidators: true })`
- **PROHIBIDO**: `$push`, `$inc` o cualquier operación relativa
- Reenviar la misma petición debe dejar el mismo estado final, sin duplicar datos ni corromper el orden

**Endpoints adicionales**: Seguir las mismas reglas según el contrato

## Idempotencia y Concurrrencia

### PATCH Ticket
- Operación idempotente: reenviar la misma petición produce el mismo estado final
- Usar `$set` con valores absolutos (nunca operaciones relativas)
- Validar que el ticket esté en la columna de origen o ya en la destino (permite reintentos)
- Si es movimiento y no viene position, asignar solo en el primer movimiento
- Control de concurrencia: usar `findOneAndUpdate` con condición `_id` y `board`

## Método de Trabajo con Agentes

### Contratos Primero
1. Generar tabla de endpoints (contrato)
2. Generar colección Postman basada SOLO en el contrato
3. NO escribir código hasta validar el contrato

### Partición Generativa
- **Fase 1**: Solo modelos (schemas + hooks de cascada)
- **Fase 2**: Solo validación (ApiError, entityManager, middlewares)
- **Fase 3**: Solo controladores y rutas
- **Fase 4**: Entregables (README, commits, despliegue)

### Prompt de Refuerzo
Al pedir al agente que trabaje:
- "Seguí exactamente AGENTS.md"
- "Trabajá por fases, detente y espera 'validado' después de cada fase"
- "No mezcles responsabilidades: models, controllers, routes separados"
- "Usa entityManager para evitar repetición"
- "Usa errorHandler único para respuestas de error"

## Convenciones de Repositorio

### Conventional Commits
- `feat:`: Nueva funcionalidad
- `docs:`: Documentación
- `chore:`: Configuración, dependencias
- `fix:`: Corrección de bugs
- `refactor:`: Refactorización sin cambio de funcionalidad

### Estructura de Carpetas
```
src/
├── models/
│   ├── Board.js
│   ├── Column.js
│   └── Ticket.js
├── controllers/
│   ├── boardController.js
│   ├── columnController.js
│   └── ticketController.js
├── routes/
│   ├── boardRoutes.js
│   ├── columnRoutes.js
│   └── ticketRoutes.js
├── middlewares/
│   ├── errorHandler.js
│   ├── validateObjectId.js
│   ├── loadBoard.js
│   └── loadColumn.js
├── services/
│   └── entityManager.js
├── errors/
│   └── ApiError.js
├── config/
│   └── db.js
├── app.js
└── server.js
```

## Rutas Anidadas

Usar `Router({ mergeParams: true })` para encadenar:
```
boards -> :boardId (validateObjectId + loadBoard)
  -> columns -> :columnId (validateObjectId + loadColumn)
    -> tickets -> :ticketId (validateObjectId)
```

## Variables de Entorno

- `PORT`: Puerto del servidor (default: 3000)
- `MONGODB_URI`: URI de conexión a MongoDB

## Health Check

- `GET /health`: Retorna `{ status: "ok", timestamp: "ISO string" }`
- `GET /api`: Retorna `{ message: "Kanban API", version: "1.0.0" }`

---

## Estado de Implementación

✅ **Fase 0**: Contrato y documentación primero (AGENTS.md, .env.example, .gitignore, package.json, Postman collection)
✅ **Fase 1**: Modelos MongoDB (Board.js, Column.js, Ticket.js con hooks de cascada)
✅ **Fase 2**: Validación y reglas de negocio (ApiError, entityManager, middlewares)
✅ **Fase 3**: Controladores y rutas (boardController, columnController, ticketController, rutas anidadas)
✅ **Fase 4**: Entregables (README.md, estructura completa, lista de commits)

El proyecto está implementado siguiendo estrictamente estas especificaciones.
