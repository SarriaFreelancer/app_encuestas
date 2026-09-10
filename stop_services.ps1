# Script para detener todos los servicios de App Encuestas

Write-Host "Deteniendo servicios de App Encuestas..." -ForegroundColor Yellow

# 1. Detener procesos de PowerShell de monitoreo (start_services.ps1)
Get-WmiObject Win32_Process -Filter "Name='powershell.exe'" | Where-Object {
    $_.CommandLine -like "*start_services.ps1*"
} | ForEach-Object {
    Write-Host "Deteniendo script de monitoreo (PID: $($_.ProcessId))..." -ForegroundColor Cyan
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}

# 2. Detener Backend (Python / Uvicorn puerto 8000)
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.OwningProcess -gt 0) {
        Write-Host "Deteniendo Backend FastAPI (PID: $($_.OwningProcess))..." -ForegroundColor Cyan
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# 3. Detener Frontend (Node / Next.js puerto 3007 y 3008)
Get-NetTCPConnection -LocalPort 3007, 3008 -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.OwningProcess -gt 0) {
        Write-Host "Deteniendo Frontend Next.js (PID: $($_.OwningProcess))..." -ForegroundColor Cyan
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Todos los servicios han sido detenidos correctamente." -ForegroundColor Green
