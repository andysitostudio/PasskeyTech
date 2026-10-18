// Novedades que ve el usuario dentro de la app. Agrega SIEMPRE un bloque nuevo arriba antes de publicar:
// la version debe ser la misma que vas a publicar (publicar.ps1 lo revisa).
module.exports = [
  {
    version: '0.4.0', fecha: '2026-10-16', titulo: 'Actualizaciones automáticas',
    cambios: [
      'PasskeyOS busca actualizaciones en GitHub: con el botón Actualizar PasskeyOS o automáticamente (se activa en Ajustes).',
      'Si hay una versión nueva, eliges Actualizar o Después. Una vez descargada, se instala sola al cerrar la app.',
      'Ahora puedes ver las novedades de la versión actual y de las anteriores desde Ajustes.',
      'Instalador de Windows (Setup.exe) con publicación desde la terminal.',
      'Documentos legales: Términos de Uso, Política de Privacidad, Condiciones, EULA, Acuerdo Legal, Seguridad y Cifrado, Datos Locales y Licencias de Terceros. La app pide aceptarlos al empezar y el instalador muestra el EULA.',
      'Seguridad: nueva opción para cambiar la contraseña maestra y borrado de la clave en memoria al bloquear.',
      'Extensión de Edge: rellena y guarda contraseñas desde el navegador y se desbloquea con tu PIN. La vinculación y cada mensaje van cifrados y solo viajan dentro de tu equipo.',
      'Más seguridad: la app se bloquea al bloquear Windows o suspender el equipo, difumina la ventana al perder el foco y niega permisos del sistema. La extensión guarda su clave como no exportable, queda ligada a su origen y no rellena páginas sin HTTPS.',
      'Nuevo cristal real de Windows 11 (opcional) y más animaciones Liquid Glass en la app y en la extensión.',
      'PasskeyOS sigue en segundo plano (bandeja del sistema) al cerrar la ventana; usa Salir en el ícono de la bandeja para cerrarla del todo.'
    ]
  },
  {
    version: '0.3.0', fecha: '2026-10-16', titulo: 'Autenticador y personalización',
    cambios: [
      'Autenticador integrado: guarda la clave 2FA de cada cuenta y mira el código de 6 dígitos en vivo.',
      'Más personalización: tu nombre, tamaño del texto y redondeo de las ventanas.'
    ]
  },
  {
    version: '0.2.0', fecha: '2026-10-16', titulo: 'Liquid Glass',
    cambios: ['Logo y estilo Liquid Glass con animaciones.', 'Importar y exportar contraseñas (CSV y .pkx cifrado).', 'Ajustes de color, fondo y bloqueo automático.']
  },
  { version: '0.1.0', fecha: '2026-10-16', titulo: 'Primera versión', cambios: ['Bóveda cifrada, PIN de acceso rápido y generador de claves.'] }
];
