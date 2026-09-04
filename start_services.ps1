# Script de auto-recuperación y arranque continuo para App Encuestas

$appDir = "c:\Informacion David\Desarrollo\app_encuentas"
$logFile = "$appDir\services.log"

function Log-Message($msg) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$timestamp] $msg" | Out-File -FilePath $logFile -Append
}

Log-Message "Iniciando servicio de monitoreo de App Encuestas..."

while ($true) {
    # 1. Monitoreo y arranque del Backend (FastAPI - Puerto 8000)
    $backendConn = Test-NetConnection -ComputerName "127.0.0.1" -Port 8000 -InformationLevel Quiet
    if (-not $backendConn) {
        Log-Message "El backend (puerto 8000) no responde. Levantando proceso..."
        Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"cd '$appDir\backend'; .\venv\Scripts\activate; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`"" -WindowStyle Hidden
    }

    # 2. Monitoreo y arranque del Frontend (Next.js - Puerto 3007)
    $frontendConn = Test-NetConnection -ComputerName "127.0.0.1" -Port 3007 -InformationLevel Quiet
    if (-not $frontendConn) {
        Log-Message "El frontend (puerto 3007) no responde. Levantando proceso..."
        Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"cd '$appDir\frontend'; npm run dev -- -p 3007`"" -WindowStyle Hidden
    }

    Start-Sleep -Seconds 15
}
