/* Capa de datos de Detección de alarmas · Supabase.
   Misma interfaz que tenía con localStorage, así app.js casi no cambia.

   · El PROYECTO es el de la Suite (número y nombre vienen de ahí). Los datos de esta
     herramienta viven en proyecto_herramientas (herramienta = 'deteccion'), con control
     optimista: el UPDATE exige que la fila siga con la fecha que se leyó.
   · El CATÁLOGO (fabricantes, dispositivos, cables y baterías) vive en catalogos
     (herramienta = 'deteccion'): lo lee todo usuario aprobado y solo lo escribe el
     administrador (RLS). Sin fila publicada se usa el catálogo base (js/catalogo-base.js).
   · Los guardados se encolan: el autoguardado puede disparar uno nuevo antes de que
     termine el anterior, y sin la cola el segundo usaría una versión vieja y fallaría. */
(function (global) {
  'use strict';
  var HERR = 'deteccion';
  function clonar(o) { return JSON.parse(JSON.stringify(o)); }
  function sb() { return Acceso.cliente(); }
  function uid(prefijo) { return (prefijo || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  var suite = null, version = null, catVersion = null, custom = false, cola = Promise.resolve();
  function enfilar(fn) {
    var r = cola.then(fn);
    cola = r.catch(function () {});
    return r;
  }
  function desdeBase() {
    var c = clonar(global.CATALOGO_BASE);
    c.baseVersion = c.version;
    return c;
  }
  // Catálogo publicado antes de una versión nueva del catálogo base: se suman, sin tocar lo editado, los registros
  // nuevos del base (por id); lo que el administrador borre después no vuelve a agregarse en esa versión.
  function actualizarDesdeBase(c) {
    var base = global.CATALOGO_BASE;
    if ((c.baseVersion || 0) >= base.version) return c;
    ['fabricantes', 'dispositivos', 'cables'].forEach(function (t) {
      var ids = {};
      (c[t] = c[t] || []).forEach(function (x) { ids[x.id] = 1; });
      (base[t] || []).forEach(function (x) { if (!ids[x.id]) c[t].push(clonar(x)); });
    });
    // Dispositivos con la corriente en blanco: se completan con la de la ficha del base (no se pisa lo que ya tenga valor)
    (c.dispositivos || []).forEach(function (d) {
      (base.dispositivos || []).forEach(function (x) {
        if (x.id !== d.id) return;
        var llena = false;
        if ((d.iEspera === null || d.iEspera === undefined) && x.iEspera !== null) { d.iEspera = x.iEspera; llena = true; }
        if ((d.iAlarma === null || d.iAlarma === undefined) && x.iAlarma !== null) { d.iAlarma = x.iAlarma; llena = true; }
        if (llena) d.obs = x.obs;
        if (x.circuito2 && !d.circuito2) d.circuito2 = x.circuito2;
      });
    });
    c.baseVersion = base.version;
    return c;
  }

  global.Store = {
    conflict: false,

    init: function (proyectoId) {
      return sb().from('proyectos').select(DatosProyecto.COLUMNAS).eq('id', proyectoId).maybeSingle().then(function (r) {
        if (r.error || !r.data) return null;
        suite = r.data; return suite;
      });
    },
    proyecto: function () { return suite; },

    getProyecto: function () {
      return sb().from('proyecto_herramientas').select('datos,actualizado_en')
        .eq('proyecto_id', suite.id).eq('herramienta', HERR).maybeSingle().then(function (r) {
          if (r.error) throw r.error;
          version = r.data ? r.data.actualizado_en : null;
          return r.data ? r.data.datos : null;
        });
    },
    // Devuelve true si guardó, 'conflicto' si otro usuario guardó primero y false si falló
    saveProyecto: function (proyecto) {
      var self = this, datos = clonar(proyecto);
      return enfilar(function () {
        self.conflict = false;
        var q;
        if (version) {
          q = sb().from('proyecto_herramientas').update({ datos: datos })
            .eq('proyecto_id', suite.id).eq('herramienta', HERR).eq('actualizado_en', version).select('actualizado_en')
            .then(function (r) { return { r: r, choque: !r.error && !(r.data && r.data.length) }; });
        } else {
          q = sb().from('proyecto_herramientas').insert({ proyecto_id: suite.id, herramienta: HERR, datos: datos }).select('actualizado_en')
            .then(function (r) { return { r: r, choque: !!(r.error && r.error.code === '23505') }; });
        }
        return q.then(function (x) {
          if (x.choque) { self.conflict = true; return 'conflicto'; }
          if (x.r.error) { console.error(x.r.error); return false; }
          version = x.r.data[0].actualizado_en; return true;
        });
      });
    },
    changed: function () {
      return sb().from('proyecto_herramientas').select('actualizado_en')
        .eq('proyecto_id', suite.id).eq('herramienta', HERR).maybeSingle().then(function (r) {
          if (r.error) return false;
          return (r.data ? r.data.actualizado_en : null) !== version;
        });
    },

    getCatalogo: function () {
      return sb().from('catalogos').select('datos,version').eq('herramienta', HERR).maybeSingle().then(function (r) {
        if (!r.error && r.data) { custom = true; catVersion = r.data.version; return actualizarDesdeBase(r.data.datos); }
        if (r.error) console.warn('Catálogo: se usa el base (', r.error.message, ')');
        custom = false; catVersion = null;
        var c = desdeBase(); c.sinSemilla = true; return c;     // el administrador ve el aviso para publicarlo
      }, function () { custom = false; catVersion = null; var c = desdeBase(); c.sinSemilla = true; return c; });
    },
    // El segundo argumento (tablas sucias) ya no hace falta: el catálogo se publica completo
    saveCatalogo: function (cat) {
      return enfilar(function () {
        if (!global.Auth.esAdmin()) throw new Error('Se requieren permisos de administrador');
        var datos = clonar(cat); delete datos.sinSemilla;
        datos.actualizado = new Date().toISOString().slice(0, 10);
        var q;
        if (custom) {
          q = sb().from('catalogos').update({ datos: datos }).eq('herramienta', HERR).eq('version', catVersion).select('version')
            .then(function (r) { return { r: r, choque: !r.error && !(r.data && r.data.length) }; });
        } else {
          q = sb().from('catalogos').insert({ herramienta: HERR, datos: datos }).select('version')
            .then(function (r) { return { r: r, choque: !!(r.error && r.error.code === '23505') }; });
        }
        return q.then(function (x) {
          if (x.choque) throw new Error('Otro administrador modificó el catálogo. Recargue la página para ver la versión actual.');
          if (x.r.error) throw new Error(x.r.error.message);
          custom = true; catVersion = x.r.data[0].version; delete cat.sinSemilla; return true;
        });
      });
    },
    restablecerCatalogo: function () {
      return enfilar(function () {
        if (!global.Auth.esAdmin()) throw new Error('Se requieren permisos de administrador');
        return sb().from('catalogos').delete().eq('herramienta', HERR).select('herramienta').then(function (r) {
          if (r.error) throw new Error(r.error.message);
          custom = false; catVersion = null; return desdeBase();
        });
      });
    },
    hasCustomCatalog: function () { return custom; }
  };

  // Permisos: los da la Suite (rol Administrador)
  global.Auth = { esAdmin: function () { return Acceso.alMenos('Administrador'); } };
  global.uid = uid;
  global.clonar = clonar;
})(window);
