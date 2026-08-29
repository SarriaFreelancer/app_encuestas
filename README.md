# 📊 Plataforma Analítica de Gestión de Encuestas y Caracterización de Víctimas

Sistema web full-stack moderno, interactivo y responsivo para el procesamiento, análisis cruzado, reportería y visualización de encuestas procedentes de Google Sheets / Excel.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React.
- **Backend:** FastAPI, Python 3.12, Uvicorn, Pandas, OpenPyXL, JOSE (JWT).
- **Almacenamiento:** Repositorio en memoria / JSON estructurado con compatibilidad 100% fiel a Google Sheets.

---

## 👥 Credenciales de Acceso

| Rol | Usuario | Contraseña | Permisos |
|---|---|---|---|
| **Super Admin** | `superadmin` | `superadmin123` | Control total, crear/editar/eliminar admins y usuarios. |
| **Admin** | `admin` | `admin123` | Gestión de encuestas, crear/editar/eliminar operadores. |
| **Operador** | `usuario1` | `admin123` | Visualización, toma de encuestas, consultas. |

---

## 🚀 Guía Paso a Paso para Ejecución Local (Puerto 3007) y Exposición con Ngrok

Sigue estos sencillos pasos desde la terminal de **Visual Studio Code** (`Ctrl + \``):

### 1️⃣ Paso 1: Iniciar el Servidor Backend (FastAPI - Puerto 8000)

Abre la primera pestaña de terminal en VS Code y ejecuta:

```powershell
# 1. Ir a la carpeta backend
cd backend

# 2. Activar el entorno virtual de Python
.\venv\Scripts\activate

# 3. Iniciar el servidor FastAPI
python -m uvicorn app.main:app --reload --port 8000
```
> 🟢 **Backend activo en:** `http://127.0.0.1:8000` (Documentación Swagger en `http://127.0.0.1:8000/docs`)

---

### 2️⃣ Paso 2: Iniciar el Servidor Frontend (Next.js - Puerto 3007)

Abre una **segunda pestaña de terminal** (icono `+` en la esquina de la consola) y ejecuta:

```powershell
# 1. Ir a la carpeta frontend
cd frontend

# 2. Iniciar el servidor Next.js en el puerto 3007
npm run dev:3007
```
> *(Alternativa: `npm run dev -- -p 3007`)*  
> 🟢 **Frontend activo en:** `http://localhost:3007`

---

### 3️⃣ Paso 3: Exponer a Internet con Ngrok desde Visual Studio Code

Abre una **tercera pestaña de terminal** y ejecuta cualquiera de estas dos opciones:

#### Opción A (Si ya tienes ngrok instalado):
```powershell
ngrok http 3007
```

#### Opción B (Usando npx sin instalar nada global):
```powershell
npx ngrok http 3007
```

**Ngrok generará una URL pública segura**, por ejemplo:
```text
Forwarding: https://abc1-201-244-10-5.ngrok-free.app -> http://localhost:3007
```

Copia ese enlace `https://...` y ábrelo desde cualquier dispositivo, celular o compártelo con tu equipo.

---

## ✨ Características y Módulos Principales

1. **Dashboard Analítico Multi-Gráficos 2D:**
   - Gráficos circulares / pastel (Sexo, Zona, Discapacidad, Libreta Militar, Fuente de Ingresos).
   - Gráficos de barras horizontales (Tipo de Hecho Victimizante, Municipio, Principal Afectación, Barrio/Vereda).
   - Gráficos de columnas verticales (Nivel Educativo, Situación Laboral, Menores vs Mayores).
   - Gráfico de columnas agrupadas para Necesidades (Prioritaria, Secundaria y Terciaria).
   - Línea de tiempo cronológica interactiva con **filtrado cruzado en tiempo real al hacer clic en cualquier año**.
   - Botonera superior de controles de filtros rápidos reorganizables dinámicamente.

2. **Diseño Responsivo y Temas:**
   - **Modo Claro / Modo Oscuro** con guardado de preferencias en `localStorage`.
   - **Menú lateral minimizable (`<< Contraer menú` / `>>`)** para ganar espacio visual en monitores o modo drawer en móviles.

3. **Gestión de Usuarios (CRUD):**
   - Creación, edición de roles, cambio de contraseñas y desactivación/eliminación de usuarios.
   - Protección con máscara para que los administradores no detecten la presencia de la cuenta Super Admin.

4. **Depuración Automática de Datos:**
   - Omisión inteligente de filas 100% vacías, conservando campos vacíos en filas con datos válidos.
