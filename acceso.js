/* ============================================================
   Sinergia Acceso · Núcleo
   ------------------------------------------------------------
   Sesión, jerarquía de roles y guardián de páginas. Un solo
   archivo para toda la aplicación: ninguna pantalla vuelve a
   escribir su propio bloque de sesión.

   Se copia tal cual entre proyectos. Lo que cambia por app vive
   en acceso-config.js.

   ------------------------------------------------------------
   LA JERARQUÍA
   ------------------------------------------------------------
   Los roles son una lista ascendente y la comparación se hace por
   POSICIÓN, no por nombre:

     ['Usuario','Coordinador','Administrador']
          0            1              2

   Una página pide `nivelMinimo:'Coordinador'` y entra todo el que
   esté en esa posición o más arriba. Por eso insertar un rol
   intermedio no obliga a revisar ni una pantalla: las que exigen
   'Administrador' siguen cerradas y las que exigen 'Coordinador'
   se abren solas para el rol nuevo.

   ------------------------------------------------------------
   DÓNDE VIVE LA VERDAD
   ------------------------------------------------------------
   El rol y el estado se leen SIEMPRE de la base en cada carga de
   página. Lo que se guarda en localStorage es comodidad para
   pintar un nombre sin esperar la consulta, y nada más: nunca se
   usa para decidir si alguien pasa o no. Quien edite su
   localStorage no gana un solo permiso.
   ============================================================ */

window.Acceso = (function () {
  'use strict';

  var _cliente = null;
  var _perfil  = null;

  /* ---- Configuración ---------------------------------------- */

  function config() {
    var cfg = window.ACCESO_CONFIG;
    if (!cfg) throw new Error('Acceso: falta acceso-config.js (se enlaza antes que acceso.js)');
    return cfg;
  }

  function jerarquia() {
    var j = config().jerarquia;
    if (!Array.isArray(j) || j.length < 2) j = ['Usuario', 'Administrador'];
    // La base mínima del módulo. Si no se respeta, el guardián no
    // tiene ni piso ni techo con que comparar y todo queda abierto
    // o todo cerrado; conviene enterarse en la consola y no en
    // producción.
    if (j[0] !== 'Usuario' || j[j.length - 1] !== 'Administrador') {
      console.error(
        'Acceso: la jerarquía debe empezar en "Usuario" y terminar en "Administrador". ' +
        'Recibida: ' + JSON.stringify(j)
      );
    }
    return j;
  }

  function paginaIngreso() { return config().paginaIngreso || 'ingreso.html'; }

  /* ---- Cliente Supabase ------------------------------------- */

  function cliente() {
    if (_cliente) return _cliente;
    var cfg = config();
    if (typeof supabase === 'undefined') {
      throw new Error('Acceso: falta el SDK de Supabase (supabase-js@2) antes de acceso.js');
    }
    _cliente = supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
    return _cliente;
  }

  /* ---- Jerarquía -------------------------------------------- */

  // Posición del rol. -1 si no está en la lista: un rol
  // desconocido queda por debajo de todo, que es el lado seguro.
  function nivel(rol) { return jerarquia().indexOf(rol); }

  // ¿El rol dado (o el del perfil cargado) llega al mínimo pedido?
  function alMenos(rolMinimo, rol) {
    var quien = rol || (_perfil && _perfil.rol);
    if (!quien) return false;
    var min = nivel(rolMinimo);
    if (min < 0) return false;       // mínimo mal escrito → no se abre
    return nivel(quien) >= min;
  }

  function destino(rol) {
    var d = config().destinos || {};
    return d[rol] || d[jerarquia()[0]] || 'inicio.html';
  }

  /* ---- Sesión ----------------------------------------------- */

  function perfil() { return _perfil; }

  function irA(pagina) { window.location.replace(pagina); }

  function recordar(p) {
    try {
      localStorage.setItem('acceso_rol', p.rol || '');
      localStorage.setItem('acceso_nombre', p.nombre_completo || p.correo || '');
      localStorage.setItem('acceso_correo', p.correo || '');
    } catch (e) { /* modo privado: seguimos sin caché */ }
  }

  function olvidar() {
    try {
      ['acceso_rol', 'acceso_nombre', 'acceso_correo'].forEach(function (k) {
        localStorage.removeItem(k);
      });
    } catch (e) { /* nada que limpiar */ }
  }

  // Rellena la barra: el correo y el botón Salir de suite-app.css.
  // Se hace acá para que ninguna página tenga que acordarse.
  function pintarSesion() {
    if (!_perfil) return;
    document.querySelectorAll('.sesion-correo').forEach(function (el) {
      el.textContent = _perfil.correo || '';
    });
    document.querySelectorAll('.sesion-salir').forEach(function (b) {
      b.addEventListener('click', salir);
    });
    document.querySelectorAll('[data-acceso="nombre"]').forEach(function (el) {
      el.textContent = _perfil.nombre_completo || _perfil.correo || '';
    });
    document.querySelectorAll('[data-acceso="rol"]').forEach(function (el) {
      el.textContent = _perfil.rol || '';
    });
  }

  /* ---- El guardián ------------------------------------------
     Cuatro pasos, en este orden:
       1. sin sesión            → a la pantalla de ingreso
       2. estado ≠ Aprobado     → a ingreso, que muestra la espera
       3. nivel insuficiente    → a lo suyo, según `destinos`
       4. todo bien             → pinta la barra y devuelve el perfil

     Devuelve null cuando rebota. Quien llame debe cortar ahí:

       const perfil = await Acceso.proteger({ nivelMinimo:'Administrador' });
       if (!perfil) return;
     ------------------------------------------------------------ */
  async function proteger(opciones) {
    opciones = opciones || {};
    var sb = cliente();

    var ses = await sb.auth.getSession();
    var session = ses && ses.data ? ses.data.session : null;
    if (!session) { irA(paginaIngreso()); return null; }

    var res = await sb.from('usuarios')
      .select('id,correo,nombre_completo,rol,estado')
      .eq('id', session.user.id)
      .single();

    var p = res.data;
    if (!p || p.estado !== 'Aprobado') { irA(paginaIngreso()); return null; }

    _perfil = p;
    recordar(p);

    if (opciones.nivelMinimo && !alMenos(opciones.nivelMinimo, p.rol)) {
      irA(destino(p.rol));
      return null;
    }

    pintarSesion();
    return p;
  }

  // Oculta lo que no corresponde al nivel del usuario. Es cosmética
  // —quien sepa el URL igual rebota contra proteger()—, pero evita
  // ofrecer puertas cerradas.
  function mostrarSi(rolMinimo) {
    var visible = alMenos(rolMinimo);
    var selectores = Array.prototype.slice.call(arguments, 1);
    selectores.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.style.display = visible ? '' : 'none';
      });
    });
    return visible;
  }

  async function salir() {
    try { await cliente().auth.signOut(); } catch (e) { /* igual salimos */ }
    olvidar();
    irA(paginaIngreso());
  }

  /* ---- Aviso flotante (compartido por las pantallas) -------- */

  var _tToast = null;
  function toast(texto, esError) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = texto;
    t.className = 'toast show' + (esError ? ' err' : '');
    clearTimeout(_tToast);
    _tToast = setTimeout(function () { t.className = 'toast'; }, 3200);
  }

  return {
    config:     config,
    cliente:    cliente,
    jerarquia:  jerarquia,
    nivel:      nivel,
    alMenos:    alMenos,
    destino:    destino,
    proteger:   proteger,
    perfil:     perfil,
    mostrarSi:  mostrarSi,
    salir:      salir,
    toast:      toast
  };
})();
