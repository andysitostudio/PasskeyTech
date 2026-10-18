# PasskeyTech (PasskeyOS)

Gestor de contraseñas de escritorio hecho con Electron.

## Probar sin instalar
Doble clic en `iniciar.bat` (instala dependencias la primera vez). Las actualizaciones NO funcionan en este modo: solo en la app instalada.

## Publicar una versión (desde la terminal)
1. Agrega un bloque nuevo arriba en `novedades.js` con la versión que vas a publicar (ejemplo: `0.4.0`).
2. Abre PowerShell en esta carpeta y ejecuta:
   `powershell -ExecutionPolicy Bypass -File .\publicar.ps1`
3. Elige a qué versión pasar (la primera vez, la opción 2 deja la 0.4.0).
4. La primera vez pide un token de GitHub (Settings > Developer settings > Personal access tokens, con permiso de escritura en "Contents" del repo PasskeyTech). Queda guardado cifrado en `.gh-token` (no se sube a GitHub).
5. El script compila, sube a GitHub Releases el instalador (`PasskeyTech-Setup-X.Y.Z.exe`), su `.blockmap` y `latest.yml`, y verifica que estén los tres.
Si algo queda a medias: `.\publicar.ps1 -Reintentar`.

## Instalar y actualizar
1. Instala una vez el `PasskeyTech-Setup-X.Y.Z.exe` desde la página de Releases del repo. Windows puede mostrar SmartScreen porque el instalador no está firmado: Más información > Ejecutar de todas formas.
2. Dentro de la app: botón **Actualizar PasskeyOS** (barra lateral o Ajustes), o activa **Buscar actualizaciones automáticamente** en Ajustes.
3. Si hay versión nueva eliges **Actualizar** o **Después**. Cuando termina de descargar, se instala al cerrar la app (o con **Reiniciar e instalar**).
4. Al abrir la versión nueva aparecen las novedades; las de versiones anteriores están en Ajustes > Ver novedades.

## Seguridad
- Bóveda cifrada con AES-256-GCM (clave protegida por tu contraseña maestra con scrypt). El PIN es acceso rápido atado a tu usuario de Windows y se bloquea tras 5 fallos.
- Se bloquea sola por inactividad; el portapapeles se limpia a los 20 segundos.
- La bóveda queda en `%APPDATA%\PasskeyTech\passkey.vault`, fuera del instalador: actualizar no la toca.
- Exportar a CSV deja las contraseñas sin cifrar. Prefiere el `.pkx`.

## Pendiente
Extensión de Edge con autorelleno y aviso "¿guardar esta contraseña?", y ejecución en segundo plano.
