# Supabase Keep-Alive - Documentación del Sistema

## Visión General

**Supabase Keep-Alive** es una aplicación web construida con **Next.js 15** que permite monitorear y mantener activos múltiples proyectos de Supabase mediante pings automáticos a endpoints configurables. El sistema evita que los proyectos de Supabase se pausen por inactividad.

---

## Arquitectura del Sistema

### Stack Tecnológico

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Despliegue**: Vercel (con Cron Jobs)
- **Encriptación**: PGP Symmetric Encryption (pgcrypto)
- **Gráficos**: Recharts + shadcn/ui Charts

### Estructura de Directorios

```
supabase-keepalive/
├── src/
│   ├── app/                    # Páginas y rutas API
│   │   ├── api/               # Endpoints REST
│   │   │   ├── configs/       # CRUD de configuraciones
│   │   │   ├── keepalive/     # Ejecución de pings
│   │   │   ├── stats/         # Estadísticas
│   │   │   └── vercel/        # Integración Vercel
│   │   ├── dashboard/         # Panel principal
│   │   │   ├── stats/         # Página de estadísticas
│   │   │   └── wizard/        # Asistente de configuración
│   │   ├── login/             # Página de autenticación
│   │   └── auth/              # Callbacks de autenticación
│   ├── components/            # Componentes React
│   │   ├── ui/               # Componentes base (Button, Card, etc.)
│   │   ├── stats/            # Componentes de estadísticas
│   │   │   ├── KeepaliveStatsChart.tsx
│   │   │   ├── ResponseTimeChart.tsx
│   │   │   ├── SuccessRateChart.tsx
│   │   │   ├── ConfigHealthChart.tsx
│   │   │   ├── HourlyDistributionChart.tsx
│   │   │   ├── EndpointStatusChart.tsx
│   │   │   ├── VercelUsageChart.tsx
│   │   │   └── OverviewCards.tsx
│   │   ├── AuthForm.tsx      # Formulario login/registro
│   │   ├── ConfigForm.tsx    # Formulario de configuración
│   │   ├── ConfigTable.tsx   # Tabla de configuraciones
│   │   ├── LogViewer.tsx     # Visor de logs
│   │   ├── Navbar.tsx        # Barra de navegación
│   │   └── SetupWizard.tsx   # Asistente de configuración
│   ├── lib/                   # Utilidades
│   │   ├── supabase/         # Clientes Supabase
│   │   │   ├── client.ts     # Cliente navegador
│   │   │   ├── server.ts     # Cliente servidor
│   │   │   ├── admin.ts      # Cliente admin (service role)
│   │   │   └── middleware.ts # Gestión de sesiones
│   │   ├── crypto.ts         # Encriptación de claves
│   │   └── utils.ts          # Utilidades generales (cn, etc.)
│   └── middleware.ts          # Middleware de Next.js
├── supabase/
│   └── migrations/           # Migraciones SQL
│       ├── 001_initial_schema.sql
│       └── 002_vercel_configs.sql
└── vercel.json               # Configuración de cron jobs
```

---

## Base de Datos

### Tabla: `connection_configs`

Almacena las configuraciones de keep-alive de cada proyecto Supabase.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `user_id` | UUID | ID del usuario propietario (FK a auth.users) |
| `alias_email` | TEXT | Nombre descriptivo del proyecto |
| `supabase_url` | TEXT | URL del proyecto Supabase |
| `anon_key` | TEXT | Clave anónima (pública) |
| `service_role_key_encrypted` | TEXT | Clave service role encriptada |
| `keepalive_endpoint_url` | TEXT | URL del endpoint a hacer ping |
| `keepalive_method` | TEXT | Método HTTP (GET o POST) |
| `keepalive_headers` | JSONB | Headers personalizados |
| `keepalive_body` | JSONB | Body para requests POST |
| `enabled` | BOOLEAN | Si la configuración está activa |
| `interval_seconds` | INTEGER | Intervalo entre pings (mín: 60s) |
| `last_attempt_at` | TIMESTAMPTZ | Último intento de ping |
| `last_success_at` | TIMESTAMPTZ | Último ping exitoso |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de última actualización |

### Tabla: `keepalive_logs`

Registra cada intento de keep-alive.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `config_id` | UUID | ID de la configuración (FK) |
| `status_code` | INTEGER | Código HTTP de respuesta |
| `response_excerpt` | TEXT | Fragmento de respuesta (máx 500 chars) |
| `attempted_at` | TIMESTAMPTZ | Fecha del intento |
| `duration_ms` | INTEGER | Duración en milisegundos |
| `error_message` | TEXT | Mensaje de error si falló |

### Tabla: `vercel_configs`

Almacena las configuraciones de Vercel del usuario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `user_id` | UUID | ID del usuario propietario (FK a auth.users, UNIQUE) |
| `token_encrypted` | TEXT | Token de Vercel encriptado |
| `team_id` | TEXT | ID del team de Vercel (opcional) |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de última actualización |

### Seguridad (Row Level Security)

- **connection_configs**: Solo el propietario puede leer, crear, actualizar y eliminar sus configuraciones
- **keepalive_logs**: Solo se pueden leer los logs de configuraciones propias
- **vercel_configs**: Solo el propietario puede leer, crear, actualizar y eliminar su configuración de Vercel
- **Service Role**: El cliente admin bypassa RLS para operaciones del cron job

---

## Funcionamiento del Sistema

### 1. Autenticación

El sistema utiliza **Supabase Auth** para gestionar usuarios:

- **Registro**: Los usuarios se registran con email y contraseña
- **Login**: Inicio de sesión con credenciales
- **Sesiones**: Gestión automática mediante cookies (middleware)
- **Protección**: Todas las rutas excepto `/login` y `/api/keepalive/cron` requieren autenticación

**Flujo**:
1. Usuario accede a `/` → Redirige a `/login` o `/dashboard`
2. Middleware verifica sesión en cada request
3. Si no hay sesión → Redirige a `/login`
4. Tras login exitoso → Redirige a `/dashboard`

### 2. Configuraciones de Keep-Alive

Los usuarios pueden crear múltiples configuraciones para diferentes proyectos Supabase.

**Campos obligatorios**:
- Alias/Email: Nombre identificativo
- Supabase URL: URL del proyecto
- Anon Key: Clave pública del proyecto
- Endpoint URL: URL del servicio a hacer ping

**Campos opcionales**:
- Service Role Key: Se encripta antes de almacenar
- Headers personalizados: JSON con headers HTTP
- Body: JSON para requests POST
- Intervalo: Tiempo entre pings (default: 300s, mínimo: 60s)

**Operaciones CRUD**:
- `GET /api/configs`: Listar configuraciones del usuario
- `POST /api/configs`: Crear nueva configuración
- `GET /api/configs/[id]`: Obtener configuración específica
- `PATCH /api/configs/[id]`: Actualizar configuración
- `DELETE /api/configs/[id]`: Eliminar configuración

### 3. Motor de Keep-Alive

#### Ejecución Automática (Cron Job)

El sistema ejecuta un cron job cada minuto configurado en `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/keepalive/cron",
      "schedule": "* * * * *"
    }
  ]
}
```

**Endpoint**: `GET /api/keepalive/cron`

**Autenticación**: Verifica header `x-cron-secret` contra la variable de entorno `CRON_SECRET`

**Proceso**:
1. Verifica secreto del cron
2. Obtiene configuraciones habilitadas
3. Filtra por intervalo (solo ejecuta si ha pasado el tiempo configurado)
4. Para cada configuración:
   - Construye headers y body
   - Ejecuta fetch con timeout de 10 segundos
   - Registra resultado en `keepalive_logs`
   - Actualiza timestamps en `connection_configs`
5. Devuelve resumen de resultados

#### Ejecución Manual

Los usuarios pueden ejecutar un ping manual desde el dashboard:

**Endpoint**: `POST /api/keepalive/run-once`

**Body**: `{ "config_id": "uuid" }`

**Proceso**:
1. Verifica autenticación del usuario
2. Verifica que la configuración pertenece al usuario (RLS)
3. Ejecuta el ping
4. Registra resultado
5. Devuelve respuesta con status, duración y fragmento de respuesta

### 4. Dashboard

#### Página Principal (`/dashboard`)

Muestra tabla con todas las configuraciones:
- **Alias**: Nombre del proyecto
- **Endpoint**: URL del servicio
- **Status**: Estado (Healthy/Stale/Disabled/No pings yet)
- **Last Ping**: Tiempo desde último ping exitoso
- **Interval**: Intervalo configurado
- **Enabled**: Switch para activar/desactivar
- **Actions**: Botones Ping, Edit, Delete

**Estados**:
- **Healthy**: Último éxito dentro del intervalo + 5 minutos
- **Stale**: Último éxito más antiguo que el intervalo + 5 minutos
- **Disabled**: Configuración desactivada
- **No pings yet**: Sin registros de ping

#### Página de Edición (`/dashboard/[id]`)

Permite editar configuración y ver logs:
- Formulario pre-rellenado con datos actuales
- Tabla con últimos 50 logs
- Información de status, duración y errores

#### Página Nueva Configuración (`/dashboard/new`)

Formulario vacío para crear nueva configuración.

#### Página de Estadísticas (`/dashboard/stats`)

Dashboard completo con gráficos interactivos y métricas clave:

**Tarjetas de Resumen (OverviewCards)**:
- Total de configuraciones
- Configuraciones activas
- Total de pings realizados
- Pings exitosos vs fallidos
- Tiempo promedio de respuesta
- Proyectos de Vercel conectados

**Pestañas de Estadísticas**:

1. **Vista General**:
   - Gráfico de área: Pings exitosos vs fallidos por día (últimos 30 días)
   - Gráfico de pastel: Tasa de éxito general
   - Gráfico de pastel: Estado de endpoints (Healthy/Stale/Disabled)

2. **Rendimiento**:
   - Gráfico de líneas: Tiempos de respuesta (promedio, máximo, mínimo)
   - Métricas de rendimiento detalladas

3. **Distribución**:
   - Gráfico de barras: Distribución de pings por hora del día

4. **Salud**:
   - Gráfico de barras horizontal: Tasa de éxito por configuración

**Componentes de Gráficos** (basados en shadcn/ui + Recharts):
- `KeepaliveStatsChart`: Gráfico de área apilada para pings
- `ResponseTimeChart`: Gráfico de líneas para tiempos de respuesta
- `SuccessRateChart`: Gráfico de donut para tasa de éxito
- `ConfigHealthChart`: Gráfico de barras para salud por configuración
- `HourlyDistributionChart`: Gráfico de barras para distribución horaria
- `EndpointStatusChart`: Gráfico de donut para estado de endpoints
- `VercelUsageChart`: Gráfico de barras para uso de Vercel

#### Página del Asistente (`/dashboard/wizard`)

Wizard paso a paso guiado para configurar cuentas:

**Paso 1: Cuenta Supabase**
- Alias/Nombre del proyecto
- Supabase URL
- Anon Key (pública)
- Service Role Key (opcional, se encripta)

**Paso 2: Keep-Alive**
- Endpoint URL del servicio
- Método HTTP (GET/POST)
- Headers personalizados (JSON)
- Body para POST (JSON)
- Intervalo en segundos

**Paso 3: Cuenta Vercel (Opcional)**
- Vercel Token
- Team ID (opcional, para teams)

**Paso 4: Revisar**
- Resumen completo de la configuración
- Botón para completar la configuración

---

## Componentes Frontend

### AuthForm
Formulario dual login/registro con validación de email y contraseña.

### ConfigForm
Formulario completo para crear/editar configuraciones:
- Validación de JSON en headers y body
- Toggle para mostrar/ocultar service role key
- Validación de intervalo mínimo (60s)

### ConfigTable
Tabla interactiva con:
- Badges de estado (colores según salud)
- Switch para activar/desactivar
- Botones de acción (Ping, Edit, Delete)
- Modal de confirmación para eliminar

### LogViewer
Tabla de logs con:
- Timestamp formateado
- Badge de status (verde/rojo)
- Duración en milisegundos
- Errores destacados
- Fragmento de respuesta

### Navbar
Barra de navegación con:
- Logo/título (link a dashboard)
- Botón Dashboard
- Botón Estadísticas
- Botón Asistente
- Botón Logout

### SetupWizard
Wizard paso a paso con:
- 4 pasos: Supabase, Keep-Alive, Vercel, Revisar
- Validación en cada paso
- Indicador de progreso visual
- Resumen final antes de guardar

### Componentes de Estadísticas
- `OverviewCards`: Tarjetas con métricas clave
- `KeepaliveStatsChart`: Gráfico de área para pings
- `ResponseTimeChart`: Gráfico de líneas para tiempos
- `SuccessRateChart`: Gráfico de donut para tasa de éxito
- `ConfigHealthChart`: Gráfico de barras para salud
- `HourlyDistributionChart`: Gráfico de barras para distribución
- `EndpointStatusChart`: Gráfico de donut para estado
- `VercelUsageChart`: Gráfico de barras para uso de Vercel

---

## Seguridad

### Encriptación de Service Role Key

Las claves service role se encriptan antes de almacenar usando **PGP Symmetric Encryption**:

```typescript
// Encriptar
const encrypted = await supabase.rpc('pgp_sym_encrypt', {
  data: plainKey,
  psw: ENCRYPTION_KEY
});

// Desencriptar
const decrypted = await supabase.rpc('pgp_sym_decrypt', {
  data: encryptedKey,
  psw: ENCRYPTION_KEY
});
```

### Variables de Entorno

| Variable | Uso | Exposición |
|----------|-----|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Cliente |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima | Cliente |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave admin | Solo servidor |
| `ENCRYPTION_KEY` | Clave de encriptación | Solo servidor |
| `CRON_SECRET` | Autenticación del cron | Solo servidor |

### Row Level Security (RLS)

Todas las operaciones de base de datos verifican que el usuario solo acceda a sus propios datos. El cliente admin (service role) bypassa RLS para operaciones del cron job.

---

## Configuración y Despliegue

### Variables de Entorno Requeridas

```bash
# Supabase (público, seguro exponer al cliente)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Solo servidor (NUNCA exponer al cliente)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ENCRYPTION_KEY=clave-de-encriptacion-de-32+-caracteres
CRON_SECRET=secreto-para-autenticacion-del-cron
```

### Migración de Base de Datos

Ejecutar la migración en Supabase SQL Editor:

```sql
-- Habilitar extensión
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ejecutar contenido de supabase/migrations/001_initial_schema.sql
```

### Despliegue en Vercel

1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Desplegar (el cron job se configura automáticamente)

---

## Flujo de Datos Completo

### Crear Configuración

```
Usuario → Formulario ConfigForm
  → POST /api/configs
    → Verificar autenticación
    → Validar datos
    → Encriptar service_role_key (si existe)
    → INSERT en connection_configs
    → Devolver configuración creada
  → Redirigir a /dashboard
```

### Ejecución de Cron Job

```
Vercel Cron (cada minuto)
  → GET /api/keepalive/cron
    → Verificar x-cron-secret
    → SELECT configuraciones habilitadas
    → Filtrar por intervalo
    → Para cada configuración:
      → Construir request (método, headers, body)
      → Ejecutar fetch con timeout 10s
      → INSERT en keepalive_logs
      → UPDATE timestamps en connection_configs
    → Devolver resumen
```

### Ping Manual

```
Usuario → Click "Ping" en ConfigTable
  → POST /api/keepalive/run-once
    → Verificar autenticación
    → Verificar propiedad (RLS)
    → Ejecutar fetch
    → INSERT en keepalive_logs
    → UPDATE timestamps
    → Devolver resultado
    → Refresh tabla
```

---

## Tecnologías y Dependencias

### Dependencias Principales

| Paquete | Versión | Uso |
|---------|---------|-----|
| `next` | ^15.1.0 | Framework React |
| `react` | ^19.0.0 | Biblioteca UI |
| `@supabase/supabase-js` | ^2.45.0 | Cliente Supabase |
| `@supabase/ssr` | ^0.5.0 | SSR con Supabase |
| `pg` | ^8.20.0 | PostgreSQL driver |
| `lucide-react` | ^0.460.0 | Iconos |
| `tailwindcss` | ^3.4.0 | CSS utility-first |

### Herramientas de Desarrollo

| Paquete | Uso |
|---------|-----|
| `typescript` | Tipado estático |
| `eslint` | Linting |
| `postcss` | Procesamiento CSS |
| `autoprefixer` | Prefijos CSS |

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo

# Producción
npm run build        # Construir para producción
npm run start        # Iniciar servidor producción

# Calidad
npm run lint         # Ejecutar ESLint
```

---

## Resumen

El sistema **Supabase Keep-Alive** proporciona una solución completa para mantener activos proyectos Supabase mediante:

1. **Autenticación segura** con Supabase Auth
2. **Configuración flexible** de endpoints y parámetros
3. **Ejecución automática** mediante cron jobs
4. **Monitoreo en tiempo real** con logs detallados
5. **Seguridad robusta** con RLS y encriptación
6. **Interfaz intuitiva** para gestión de configuraciones

La arquitectura permite escalar fácilmente añadiendo más configuraciones sin modificar el código, y el sistema de logs proporciona visibilidad completa sobre el estado de cada proyecto monitoreado.
