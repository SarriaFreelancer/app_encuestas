# Script de auto-recuperación y arranque continuo para App Encuestas

$appDir = "c:\Informacion David\Desarrollo\app_encuentas"
$logFile = "$appDir\services.log"

function Log-Message($msg) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$timestamp] $msg" | Out-File -FilePath $logFile -Append
}

Log-Message "Iniciando servicio de monitoreo de App Encuestas..."

function Test-PortOpen($targetHost, $port) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $asyncResult = $client.BeginConnect($targetHost, $port, $null, $null)
        $wait = $asyncResult.AsyncWaitHandle.WaitOne(1000, $false)
        if ($wait) {
            $client.EndConnect($asyncResult)
            $client.Close()
            return $true
        } else {
            $client.Close()
            return $false
        }
    } catch {
        return $false
    }
}

Clear-Host
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "         PLATAFORMA INTELIGENTE - SERVICIO DE MONITOREO        " -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " Iniciando y verificando servicios de la aplicación..." -ForegroundColor Yellow
Write-Host ""

$firstRun = $true

while ($true) {
    # 1. Monitoreo y arranque del Backend (FastAPI - Puerto 8000)
    $backendConn = Test-PortOpen "127.0.0.1" 8000
    if (-not $backendConn) {
        Log-Message "El backend (puerto 8000) no responde. Levantando proceso..."
        Write-Host " [!] Levantando Backend (FastAPI en puerto 8000)..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"cd '$appDir\backend'; .\venv\Scripts\activate; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`"" -WindowStyle Hidden
    }

    # 2. Monitoreo y arranque del Frontend (Next.js - Puerto 3007)
    $frontendConn = Test-PortOpen "127.0.0.1" 3007
    if (-not $frontendConn) {
        Log-Message "El frontend (puerto 3007) no responde. Levantando proceso..."
        Write-Host " [!] Levantando Frontend (Next.js en puerto 3007)..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"cd '$appDir\frontend'; npm run dev -- -p 3007`"" -WindowStyle Hidden
    }

    if ($firstRun) {
        Start-Sleep -Seconds 3
        Clear-Host
        Write-Host "================================================================" -ForegroundColor Green
        Write-Host "           EL SERVIDOR SE ENCUENTRA CORRIENDO                   " -ForegroundColor Green
        Write-Host "================================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "  -> Frontend (App Encuestas):  http://localhost:3007" -ForegroundColor Cyan
        Write-Host "  -> Backend API Docs:          http://localhost:8000/docs" -ForegroundColor Cyan
        Write-Host ""
        Write-Host " [i] Monitoreando servicios activamente en segundo plano..." -ForegroundColor Gray
        Write-Host " [i] Para detener todos los servicios ejecuta: .\stop_services.ps1" -ForegroundColor Gray
        Write-Host "================================================================" -ForegroundColor Green
        Write-Host ""
        $firstRun = $false
    }

    Start-Sleep -Seconds 15
}
