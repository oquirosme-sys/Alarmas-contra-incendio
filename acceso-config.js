/* ============================================================
   Sinergia Acceso · Configuración de la aplicación
   ------------------------------------------------------------
   ESTE ES EL ÚNICO ARCHIVO QUE SE EDITA AL MONTAR UNA APP NUEVA.
   Todo lo demás del módulo se copia sin abrirlo.

   Se enlaza ANTES que acceso.js en las cuatro páginas:

     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="acceso-config.js"></script>
     <script src="acceso.js"></script>
   ============================================================ */

window.ACCESO_CONFIG = {

  /* ---- La base de datos: cambia en cada aplicación ---------- */
  // Supabase → Project Settings → API
  supabaseUrl: 'https://nlozticjydednyfunnxy.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sb3p0aWNqeWRlZG55ZnVubnh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMTgzNjgsImV4cCI6MjA5Njc5NDM2OH0.WW56APkwXB8cG4nLmUxVAZsV-beO7sj53PGk65cLKBM',

  /* ---- Identidad de la aplicación --------------------------- */
  // clave: valor de data-app. Válidos: eva · blas · pyrocheck ·
  // eskedul · autosub-d · autosub-g · suite (ver SinergiaSuite).
  app: {
    clave:  'sng-electrical',
    nombre: 'SNG Electrical',
    lema:   'Herramientas de cálculo del equipo eléctrico'
  },

  /* ---- Registro --------------------------------------------- */
  // Sufijo obligatorio del correo al registrarse. null = sin restricción.
  dominioCorreo: '@sinergia.co.cr',

  /* ---- La jerarquía ----------------------------------------- */
  // Lista ASCENDENTE: el primero es el nivel más bajo y el último
  // el más alto. Obligatorio empezar en 'Usuario' y terminar en
  // 'Administrador'; los intermedios los agrega cada aplicación.
  //
  //   ['Usuario','Administrador']                    ← mínimo
  //   ['Usuario','Coordinador','Administrador']      ← EVA
  //
  // Las páginas piden un nivel mínimo por NOMBRE de rol, así que
  // insertar uno intermedio no obliga a tocar ninguna pantalla.
  // Si se agrega un rol acá, hay que ampliar el CHECK de la
  // columna `rol` en esquema-acceso.sql.
  jerarquia: ['Usuario', 'Administrador'],

  /* ---- A dónde va cada rol ---------------------------------- */
  // Se usa dos veces: al ingresar, y cuando alguien cae en una
  // página por encima de su nivel (se lo devuelve a lo suyo, nunca
  // a una pantalla en blanco).
  destinos: {
    Usuario:       'inicio.html',
    Administrador: 'inicio.html'
  },

  // Página de ingreso. Solo se cambia si se le pone otro nombre.
  paginaIngreso: 'ingreso.html',

  /* ---- Extensión opcional: vincular con un organigrama ------ */
  // Con null, la consola muestra las columnas base y nada más.
  // Activada, agrega la columna «Persona vinculada» leyendo de otra
  // tabla; es lo que hace EVA contra su tabla `equipo`. Requiere
  // descomentar las columnas persona_equipo y equipo del SQL.
  //
  //   vincularPersonas: {
  //     tabla:       'equipo',
  //     campoNombre: 'nombre',
  //     campoGrupo:  'equipo',
  //     filtroActivo:'activo'      // opcional: solo filas activas
  //   }
  vincularPersonas: null
};
