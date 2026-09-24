# 📊 Plataforma Analítica de Gestión de Encuestas y Caracterización de Víctimas

Sistema web full-stack moderno, interactivo y responsivo para el procesamiento, análisis cruzado, reportería y visualización de encuestas procedentes de Google Sheets / Excel.

---

## ⚙️ Instrucciones para que el Sistema Funcione Correctamente

Para desplegar y utilizar la plataforma de encuestas y caracterización, existen **dos maneras** de poner en funcionamiento el sistema:

---

### 1. 💻 Servidor Local (Entorno en tu propia Computadora)
Esta modalidad permite ejecutar la plataforma localmente en tu equipo (computador personal o servidor de la oficina) para pruebas, desarrollo o administración directa en red local.

#### 🛠️ Herramientas e Instalación Necesaria:
1. **Python 3.12 (o superior)**:
   - Requerido para ejecutar el backend (API en FastAPI).
   - Descarga e instalador oficial: [https://www.python.org/downloads/](https://www.python.org/downloads/)
   - *Importante durante la instalación:* Marcar la opción **"Add Python to PATH"**.

2. **Node.js 18 (o superior) & npm**:
   - Requerido para ejecutar el frontend (Next.js 16).
   - Descarga e instalador LTS oficial: [https://nodejs.org/](https://nodejs.org/)

3. **Git** (Opcional pero recomendado):
   - Para clonar y actualizar el repositorio de código.
   - Descarga: [https://git-scm.com/](https://git-scm.com/)

---

### 2. 🌐 Servidor Web (Hosting Cloud en Producción)
Consiste en alojar el sistema en un **Hosting / Servidor Web en la nube**, permitiendo que funcione bajo un dominio propio (por ejemplo, [www.encuestavictimas.com](http://www.encuestavictimas.com)). 

#### 🌟 Ventajas del Servidor Web:
- **Acceso desde cualquier lugar**: Se puede ingresar desde cualquier computador, tablet o celular con conexión a Internet simplemente escribiendo la URL (ejemplo: `www.encuestavictimas.com`).
- **Sin necesidad de instalar programas locales**: Los usuarios u operadores no tienen que instalar Python, Node.js ni configurar consolas; solo abren el navegador e ingresan con su **Usuario y Clave**.
- **Disponibilidad 24/7**: El tablero y las encuestas permanecen activos las 24 horas del día.

> [!IMPORTANT]
> **Nota sobre el Hosting:**
> Cabe destacar que el hosting en la nube es un **servicio de pago**, el cual se adquiere mediante suscripciones mensuales o pagos anuales (estos últimos son **altamente recomendados** por costo-beneficio y estabilidad).
> 
> Uno de los proveedores más recomendados y populares es **Hostinger** (o alternativas como VPS Hostinger, Vercel/Render, AWS, DigitalOcean), el cual ofrece planes optimizados para aplicaciones web con soporte para Next.js y Python.

---

## 👥 Credenciales de Acceso por Defecto

El sistema incluye únicamente 4 cuentas de acceso predeterminadas:

| Rol | Usuario | Contraseña | Permisos |
|---|---|---|---|
| **Super Admin** | `superadmin` | `superadmin123` | Control total del sistema, incluyendo el módulo exclusivo de **Habilitar / Configurar Módulos**, además de administración completa de usuarios y base de datos. |
| **Administrador** | `admin` | `admin123` | Acceso completo a eliminación de encuestas, gestión/creación/edición/eliminación de usuarios, Análisis cruzado, Consulta IA, Auditoría y Reportes (Todas las funciones excepto Habilitar/Configurar Módulos). |
| **Operador 1** | `Usuario1` | `Usuario345*` | Registro de encuestas, búsqueda de personas y visualización general de respuestas. |
| **Operador 2** | `Usuario2` | `Usuario789*` | Registro de encuestas, búsqueda de personas y visualización general de respuestas. |

---

## 🚀 Guía Paso a Paso para Iniciar en Servidor Local (Backend y Frontend)

El proyecto está estructurado en dos carpetas independientes:
- `backend/`: API en Python con FastAPI (Puerto `8000`).
- `frontend/`: Aplicación web en Next.js (Puerto `3007`).

---

### ⚡ Opción A: Levantar Todo Automáticamente (Recomendado)

En la raíz del proyecto existe un script de PowerShell que monitorea e inicia de forma automática y silenciosa ambos servicios (Backend en Python y Frontend con `pnpm`):

```powershell
.\start_services.ps1
```

> 🟢 **Frontend activo en:** `http://localhost:3007`  
> 🟢 **Backend API Docs:** `http://localhost:8000/docs`

#### 🛑 Para detener todos los servicios:
```powershell
.\stop_services.ps1
```

---

### 💻 Opción B: Iniciar Servidores Manualmente por Consola (Dos Terminales)

Abre dos terminales en la raíz del proyecto (`app_encuentas`):

#### 1️⃣ Terminal 1: Iniciar Backend (FastAPI / Python)

```powershell
# 1. Ingresar a la carpeta del backend
cd backend

# 2. Activar el entorno virtual de Python
.\venv\Scripts\activate

# 3. Instalar dependencias (Solo la primera vez)
pip install -r requirements.txt

# 4. Levantar el servidor Backend (FastAPI)
python -m uvicorn app.main:app --port 8000 --reload
```
> 🟢 **API Documentación Swagger:** `http://localhost:8000/docs`

---

#### 2️⃣ Terminal 2: Iniciar Frontend (Next.js con `pnpm`)

```powershell
# 1. Ingresar a la carpeta del frontend
cd frontend

# 2. Instalar dependencias (Solo la primera vez)
pnpm install

# 3. Iniciar el servidor de desarrollo en el puerto 3007
pnpm dev -p 3007
```
> 🟢 **Plataforma web activa en:** `http://localhost:3007`

*Nota: Si estás en la raíz del proyecto y deseas levantar el frontend sin cambiar de carpeta:*
```powershell
pnpm --filter frontend dev -p 3007
```

---

### 🔗 Opción C: Exposición Temporal a Internet con Ngrok

Para realizar pruebas remotas desde dispositivos móviles o compartir con tu equipo sin publicar en un servidor web definitivo:

Abre una **tercera pestaña de terminal** y ejecuta:

```powershell
pnpm dlx ngrok http --url=abroad-glancing-specked.ngrok-free.dev 3007
```

**Ngrok generará un enlace público seguro**, por ejemplo:
```text
Forwarding: https://abroad-glancing-specked.ngrok-free.dev -> http://localhost:3007
```

---

## 🛠️ Tecnologías del Proyecto

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React.
- **Backend:** FastAPI, Python 3.12, Uvicorn, Pandas, OpenPyXL, JOSE (JWT).
- **Almacenamiento:** Base de datos estructurada en JSON con sincronización e importación directa desde Google Sheets y archivos Excel.

---

## ❓ Solución de Problemas Comunes

### ❌ Error `npm error code ENOENT: Could not read package.json`
- **Causa:** Intentaste ejecutar `npm run dev` en la raíz del proyecto (`app_encuentas`) donde no se encuentra el `package.json`.
- **Solución:** Debes ingresar a la carpeta `frontend` primero:
  ```powershell
  cd frontend
  pnpm dev -p 3007
  ```

### ❌ Error `[WinError 10013] Intento de acceso a un socket no permitido` o Puerto ocupado
- **Causa:** El puerto `8000` está ocupado por una instancia anterior de Python.
- **Solución:** Para cerrar cualquier proceso previo escuchando en el puerto `8000`, ejecuta en PowerShell:
  ```powershell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force
  ```

---

## 👨‍💻 Créditos y Soporte
**Desarrollado por SarriaTech Solutions S.A.S**  
*Plataforma Analítica de Caracterización y Gestión de Encuestas.*
