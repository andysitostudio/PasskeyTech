// Documentos legales de PasskeyTech. Plantilla informativa: no es asesoría legal; conviene revisarla con un abogado antes de distribuir la app.
// Al cambiar cualquier texto, actualiza LEGAL_V: la app volverá a pedir aceptación.
const LEGAL_V = '2026-10-17.3';
const LEGAL = [
  { id: 'terminos', title: 'Términos de Uso', text: `TÉRMINOS DE USO · PasskeyTech
Última actualización: 16 de octubre de 2026

1. Aceptación. Al instalar o usar PasskeyTech (el "Software"), publicado por Andy Studios ("el Autor"), aceptas estos Términos. Si no estás de acuerdo, no uses el Software.

2. Qué es. PasskeyTech es un gestor de contraseñas local: guarda tus credenciales cifradas en tu propio equipo.

3. Uso permitido. Puedes usarlo para guardar tus propias credenciales y las de terceros que te hayan autorizado. No puedes usarlo para acceder sin permiso a cuentas ajenas, para actividades ilegales, para eludir medidas de seguridad de terceros, ni para descompilarlo o modificarlo salvo lo que la ley permita.

4. Tu responsabilidad. Eres responsable de tu contraseña maestra, de tu PIN, de tus copias de respaldo y de la seguridad de tu equipo. El Autor no puede recuperar tu contraseña maestra: si la olvidas, tus datos no se pueden recuperar.

5. Actualizaciones. El Software puede buscar y descargar actualizaciones desde GitHub. Puedes desactivar la búsqueda automática en Ajustes.

6. Disponibilidad. El Software puede cambiar, dejar de recibir soporte o dejar de ofrecerse en cualquier momento.

7. Cambios. Estos Términos pueden actualizarse; cuando eso ocurra, la app te pedirá aceptar la nueva versión.

8. Ley aplicable. Estos Términos se rigen por las leyes de Chile.` },

  { id: 'privacidad', title: 'Política de Privacidad', text: `POLÍTICA DE PRIVACIDAD · PasskeyTech
Última actualización: 16 de octubre de 2026

1. Responsable. Andy Studios, creador de PasskeyTech.

2. Lo que NO hacemos. PasskeyTech no tiene cuentas de usuario, no envía telemetría ni analíticas, no muestra publicidad y no envía tus contraseñas ni tus datos al Autor ni a terceros.

3. Lo que se guarda en tu equipo.
- Tu bóveda cifrada: %APPDATA%\\PasskeyTech\\passkey.vault.
- Tus ajustes de personalización (color, fondo, nombre, tamaño de texto, etc.), la versión legal aceptada y la última versión vista. Estos datos no contienen secretos y no están cifrados.

4. Comunicaciones de red. La única conexión a internet que hace la app es buscar y descargar actualizaciones en GitHub (github.com). GitHub puede registrar tu dirección IP y la consulta, según su propia política de privacidad. Si vinculas la extensión de Edge, la app además escucha solo en 127.0.0.1 (tu propio equipo) para hablar con ella; ese tráfico no sale a internet y va cifrado.

5. Exportaciones y portapapeles. Los archivos que exportas son tuyos y los guardas donde elijas; el CSV no está cifrado. Lo que copias al portapapeles se borra a los 20 segundos.

6. Tus derechos. Como los datos están solo en tu equipo, tú los controlas: puedes verlos, exportarlos y borrarlos (eliminando la carpeta %APPDATA%\\PasskeyTech).

7. Menores. El Software no está dirigido a menores de edad sin supervisión de un adulto responsable.

8. Cambios y contacto. Si esta política cambia, la app te pedirá aceptarla de nuevo. Contacto: repositorio github.com/andysitostudio/PasskeyTech.` },

  { id: 'condiciones', title: 'Condiciones Generales', text: `CONDICIONES GENERALES · PasskeyTech
Última actualización: 16 de octubre de 2026

1. Requisitos. PasskeyTech funciona en Windows 10 u 11 con el cifrado de usuario de Windows disponible (DPAPI), necesario para el PIN.

2. Gratuidad. A menos que se indique lo contrario, el Software se ofrece sin costo.

3. Soporte. El soporte se presta en la medida de lo posible, sin plazos ni resultados garantizados.

4. Respaldos. Haz copias de seguridad de tu bóveda (Exportar cifrado .pkx) y guárdalas en un lugar seguro. Perder el equipo o la contraseña maestra puede significar perder los datos.

5. Uso de terceros. Los servicios y sitios cuyas contraseñas guardes tienen sus propias condiciones; cumplirlas es tu responsabilidad.

6. Terminación. Puedes dejar de usar el Software en cualquier momento desinstalándolo. El Autor puede suspender su distribución.

7. Divisibilidad. Si una cláusula resultara inválida, las demás siguen vigentes.

8. Idioma. Estos documentos están en español; esa es la versión que prevalece.` },

  { id: 'eula', title: 'EULA', text: `ACUERDO DE LICENCIA DE USUARIO FINAL (EULA) · PasskeyTech
Última actualización: 16 de octubre de 2026

Este Acuerdo es entre tú y Andy Studios ("el Autor"). Al instalar o usar PasskeyTech aceptas sus términos.

1. Licencia. El Autor te concede una licencia personal, no exclusiva, intransferible y revocable para instalar y usar el Software en tus equipos.

2. Restricciones. No puedes vender, alquilar, sublicenciar ni redistribuir el Software como propio; ni quitar avisos de autoría; ni usarlo para fines ilícitos.

3. Propiedad. El Software, su nombre, logo y diseño pertenecen a Andy Studios. Los componentes de terceros se rigen por sus propias licencias (ver "Licencias de Terceros").

4. Tus datos. Tus credenciales te pertenecen. El Autor no tiene acceso a ellas ni licencia sobre ellas.

5. Sin garantía. El Software se entrega "tal como está", sin garantías de ningún tipo en la medida que la ley lo permita.

6. Limitación de responsabilidad. Se aplica lo indicado en el "Acuerdo Legal".

7. Terminación. La licencia termina si incumples este Acuerdo; en ese caso debes desinstalar el Software.

8. Ley aplicable. Leyes de Chile.` },

  { id: 'acuerdo', title: 'Acuerdo Legal', text: `ACUERDO LEGAL Y LIMITACIÓN DE RESPONSABILIDAD · PasskeyTech
Última actualización: 16 de octubre de 2026

1. Acuerdo completo. Los Términos de Uso, la Política de Privacidad, las Condiciones Generales, el EULA, la Política de Seguridad y Cifrado, la Política de Datos Locales y las Licencias de Terceros forman un solo acuerdo entre tú y Andy Studios sobre PasskeyTech.

2. Sin garantías. En la medida máxima permitida por la ley, el Software se ofrece sin garantías de funcionamiento ininterrumpido, ausencia de errores o idoneidad para un fin particular.

3. Limitación de responsabilidad. En la medida máxima permitida por la ley, el Autor no responde por: pérdida de datos o de acceso por olvidar la contraseña maestra; daños causados por programas maliciosos o por terceros con acceso a tu equipo; uso indebido del Software; ni por daños indirectos o lucro cesante.

4. Derechos irrenunciables. Nada de este Acuerdo limita los derechos que la ley chilena, incluida la normativa de protección al consumidor, te reconozca de forma irrenunciable.

5. Controversias. Se intentará resolver de buena fe. En su defecto, serán competentes los tribunales ordinarios de justicia de Chile.

6. Prevalencia y orden. Si hay contradicción, prevalece el documento más específico sobre la materia.

7. Cambios. Si cambia este Acuerdo, la app te pedirá aceptarlo de nuevo.` },

  { id: 'seguridad', title: 'Seguridad y Cifrado', text: `POLÍTICA DE SEGURIDAD Y CIFRADO · PasskeyTech
Última actualización: 16 de octubre de 2026

CÓMO SE PROTEGEN TUS DATOS
- Bóveda: cifrada con AES-256-GCM (cifrado autenticado: detecta cualquier alteración).
- Clave de la bóveda: aleatoria de 256 bits, generada en tu equipo. Se protege con tu contraseña maestra mediante scrypt (N=32768, r=8, p=1) y una sal aleatoria.
- PIN: acceso rápido. La clave protegida por el PIN se vuelve a cifrar con el cifrado de usuario de Windows (DPAPI), de modo que solo funciona en tu equipo y tu cuenta. Tras 5 intentos fallidos se exige la contraseña maestra.
- Exportación .pkx: cifrada con AES-256-GCM y una clave derivada con scrypt de la contraseña que elijas. El CSV NO está cifrado.
- Claves 2FA (TOTP): se guardan dentro de la bóveda cifrada.
- Al bloquear, la clave en memoria se sobrescribe. Bloqueo automático por inactividad, al bloquear Windows, al suspender el equipo y (si lo mantienes activado) al enviar la app a la bandeja. Opcionalmente la ventana se difumina al perder el foco. El portapapeles se limpia a los 20 segundos.

CIFRADO DE EXTREMO A EXTREMO (ZERO-KNOWLEDGE)
PasskeyTech aplica este principio: tus datos se cifran y descifran únicamente en tu dispositivo, con claves que solo existen en tu dispositivo. Ningún servidor de Andy Studios recibe tus datos ni tus claves, y el Autor no puede leerlos ni recuperarlos. Cualquier función futura que mueva datos fuera del equipo (sincronización, extensión del navegador) deberá mantener este mismo principio.

EXTENSIÓN DE EDGE
La vinculación usa un código de 8 caracteres que ves en la app (vale 2 minutos). Con ese código y un intercambio de claves ECDH P-256 se entrega a la extensión una clave de dispositivo de 256 bits. Desde entonces, cada mensaje entre la extensión y la app se cifra con AES-256-GCM, lleva marca de tiempo y no puede reutilizarse. El canal solo escucha en 127.0.0.1 y rechaza todo lo que no venga de una extensión del navegador. La app entrega una contraseña solo si la bóveda está desbloqueada y el sitio coincide con la cuenta guardada. La clave de dispositivo se guarda en la app cifrada con Windows y, en la extensión, como clave no exportable del navegador. Cada dispositivo queda ligado al origen de su extensión y la app no rellena sitios sin HTTPS (salvo localhost). Puedes desvincular todo en Ajustes.

CLAVES DE ACCESO (PASSKEYS)
PasskeyTech puede guardar claves de acceso. La clave privada se genera en tu equipo (ECDSA P-256), se guarda cifrada dentro de la bóveda y nunca se envía a la extensión ni a ningún servidor: al sitio solo llega la firma que pide. Para usarla, la bóveda debe estar desbloqueada y tú debes elegirla en el panel de PasskeyTech. Las claves de acceso no se incluyen en el CSV; sí van en la exportación .pkx cifrada.

LÍMITES
Ningún cifrado protege contra un equipo ya infectado (programas que registran teclas o leen la pantalla), contra contraseñas maestras débiles ni contra copias sin cifrar que tú generes. Usa una contraseña maestra larga y única.

REPORTAR VULNERABILIDADES
Avísanos de forma responsable por el repositorio github.com/andysitostudio/PasskeyTech, sin publicar detalles técnicos que permitan explotarla antes de que se corrija.` },

  { id: 'datos', title: 'Datos Locales y Cookies', text: `POLÍTICA DE DATOS LOCALES Y COOKIES · PasskeyTech
Última actualización: 16 de octubre de 2026

1. Cookies. PasskeyTech no usa cookies de seguimiento ni de publicidad.

2. Almacenamiento local de la app. Guarda en tu equipo: "pk" (ajustes de personalización y búsqueda automática de actualizaciones), "legalV" (versión de los documentos que aceptaste) y "lastVer" (última versión cuyas novedades viste). No contienen contraseñas.

3. Bóveda. %APPDATA%\\PasskeyTech\\passkey.vault (cifrada) y un archivo temporal .tmp durante el guardado. ext.json guarda las claves de las extensiones vinculadas, cifradas con Windows. Si instalas la extensión desde la app, se guarda una copia en %APPDATA%\\PasskeyTech\\extension.

4. Eliminar todo. Desinstala PasskeyTech y borra la carpeta %APPDATA%\\PasskeyTech. Haz antes un respaldo si quieres conservar tus datos.` },

  { id: 'terceros', title: 'Licencias de Terceros', text: `LICENCIAS DE TERCEROS · PasskeyTech
Última actualización: 16 de octubre de 2026

PasskeyTech se construye con software de código abierto:
- Electron (licencia MIT), que incluye Chromium y Node.js bajo sus propias licencias de código abierto.
- electron-updater y electron-builder (licencia MIT).

Los textos completos de estas licencias se incluyen con la aplicación instalada (archivos LICENSE y LICENSES.chromium.html) y en sus respectivos repositorios. Estas licencias se aplican a esos componentes; no cambian tus derechos sobre tus propios datos.` }
];
if (typeof module !== 'undefined') module.exports = { LEGAL, LEGAL_V };
