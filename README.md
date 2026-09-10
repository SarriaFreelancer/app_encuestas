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
| **Super Admin** | `superadmin` | `superadmin123` | Control total, crear/editar/eliminar admins y usuarios, módulos avanzados. |
| **Admin** | `admin` | `admin123` | Gestión de encuestas, crear/editar/eliminar operadores. |
| **Operador** | `usuario1` | `admin123` | Visualización, toma de encuestas, consultas. |

---

## 🚀 Guía de Inicio para Levantar los Servidores (Backend y Frontend)

El proyecto está estructurado en dos carpetas independientes:
- `backend/`: API en Python con FastAPI (Puerto `8000`).
- `frontend/`: Aplicación web en Next.js (Puerto `3007`).

---

### ⚡ Opción A: Levantar Todo Automáticamente (Recomendado)

En la raíz del proyecto existe un script de PowerShell que monitorea y mantiene vivos ambos servicios de forma continua:

Abre PowerShell en la raíz del proyecto (`app_encuentas`) y ejecuta:

```powershell
.\start_services.ps1
```

> 🟢 **Backend:** `http://127.0.0.1:8000`  
> 🟢 **Frontend:** `http://localhost:3007`

---

### 💻 Opción B: Levantar Servidores Manualmente por Consola

Abre dos pestañas de terminal en tu editor (ej. Visual Studio Code con `Ctrl + ~`):

#### 1️⃣ Terminal 1: Iniciar Servidor Backend (FastAPI - Puerto 8000)

```powershell
# 1. Ingresar a la carpeta del backend
cd backend

# 2. Activar el entorno virtual de Python
.\venv\Scripts\activate

# 3. Levantar el servidor Uvicorn (FastAPI)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
> 🟢 **Documentación interactiva de la API (Swagger):** `http://127.0.0.1:8000/docs`

---

#### 2️⃣ Terminal 2: Iniciar Servidor Frontend (Next.js - Puerto 3007)

```powershell
# 1. Ingresar a la carpeta del frontend
cd frontend

# 2. Iniciar el servidor de desarrollo de Next.js en el puerto 3007
npm run dev:3008
```
> *(Alternativa de comando directo: `npm run dev -- -p 3008`)*  
> 🟢 **Plataforma web activa en:** `http://localhost:3007`

---

### 🌐 Opción C: Exponer a Internet con Ngrok

Para probar en dispositivos móviles o compartir con tu equipo a través de un enlace público:

Abre una **tercera pestaña de terminal** y ejecuta:

```powershell
npx ngrok http 3007
```

**Ngrok generará una URL pública segura**, por ejemplo:
```text
Forwarding: https://abc1-201-244-10-5.ngrok-free.app -> http://localhost:3007
```

---

## ❓ Solución de Problemas Comunes

### ❌ Error `npm error code ENOENT: Could not read package.json`
- **Causa:** Intentaste ejecutar `npm run dev` en la raíz del proyecto (`app_encuentas`) donde no hay un `package.json`.
- **Solución:** Debes ingresar a la carpeta `frontend` primero:
  ```powershell
  cd frontend
  npm run dev:3007
  ```
  O usar desde la raíz: `npm run dev --prefix frontend -- -p 3007`

### ❌ Error `[WinError 10013] Intento de acceso a un socket no permitido`
- **Causa:** El puerto `8000` ya está en uso por un proceso previo o `0.0.0.0` requiere permisos elevados en Windows.
- **Solución 1:** Ejecuta la aplicación usando `--host 127.0.0.1` en lugar de `0.0.0.0`.
- **Solución 2:** Para cerrar cualquier proceso previo escuchando en el puerto `8000`, ejecuta en PowerShell:
  ```powershell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force
  ```

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
   - Marca de agua y copyright **Desarrollado por SarriaTech Solutions S.A.S**.

3. **Gestión de Usuarios (CRUD):**
   - Creación, edición de roles, cambio de contraseñas y desactivación/eliminación de usuarios.

4. **Centro de Reportes y Exportación:**
   - Exportación directa de respuestas a formato CSV compatible con Excel y Power BI.

5. **Depuración Automática de Datos:**
   - Omisión inteligente de filas 100% vacías, conservando campos vacíos en filas con datos válidos.
