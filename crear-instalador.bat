@echo off
cd /d "%~dp0"
set CSC_IDENTITY_AUTO_DISCOVERY=false
echo Instalando dependencias...
call npm install || goto error
echo.
echo Creando el instalador (puede tardar unos minutos)...
call npm run dist || goto error
echo.
echo Listo. El instalador esta en la carpeta dist: PasskeyTech-Setup-X.Y.Z.exe
start "" "%~dp0dist"
pause
exit /b 0

:error
echo.
echo Algo fallo. Si el mensaje dice "symbolic link", activa el Modo de desarrollador de Windows
echo (Configuracion ^> Sistema ^> Para programadores) o ejecuta este archivo como administrador.
pause
exit /b 1
