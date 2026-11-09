/* Datos generales del proyecto · compartidos por todas las herramientas.
   Número, nombre, cliente, ubicación, empresa, quién elaboró y quién revisó se llenan una sola vez, en la
   página del proyecto (proyecto.html), y viven en la tabla `proyectos`. Cada herramienta los lee de ahí y
   solo conserva lo suyo: la versión y la fecha de emisión.

     DatosProyecto.COLUMNAS     lista de columnas para el `select` de `proyectos`
     DatosProyecto.bloque(s)    HTML de solo lectura con los datos, y el enlace para editarlos
     DatosProyecto.CAMPOS       [clave, rótulo] de los campos editables */
window.DatosProyecto = (function () {
  'use strict';

  var COLUMNAS = 'id,numero,nombre,cliente,ubicacion,empresa,elaboro,reviso';
  var CAMPOS = [['cliente', 'Cliente'], ['ubicacion', 'Ubicación'], ['empresa', 'Empresa'], ['elaboro', 'Elaboró'], ['reviso', 'Revisó']];

  function esc(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  var CSS =
    '.dc{border:1px solid var(--brd);border-radius:10px;background:var(--hie);padding:12px 16px;margin-bottom:12px}' +
    '.dc-t{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:8px;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--graf)}' +
    '.dc-t a{font-size:11px;font-weight:600;letter-spacing:0;text-transform:none;color:var(--app)}' +
    '.dc-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px 20px;margin:0}' +
    '.dc-g div{min-width:0}.dc-g dt{font-size:11px;color:var(--ace);font-weight:600}' +
    '.dc-g dd{margin:1px 0 0;font-size:13px;color:var(--neg);overflow-wrap:anywhere}';
  function estilo() {
    if (document.getElementById('dc-estilo')) return;
    var st = document.createElement('style'); st.id = 'dc-estilo'; st.textContent = CSS; document.head.appendChild(st);
  }

  function bloque(s) {
    estilo();
    s = s || {};
    var filas = [['Proyecto #', s.numero], ['Nombre', s.nombre]].concat(CAMPOS.map(function (c) { return [c[1], s[c[0]]]; }));
    return '<div class="dc"><div class="dc-t"><span>Datos generales del proyecto</span>' +
      '<a href="proyecto.html?id=' + encodeURIComponent(s.id || '') + '">Editar en el proyecto</a></div><dl class="dc-g">' +
      filas.map(function (f) { return '<div><dt>' + esc(f[0]) + '</dt><dd>' + (String(f[1] || '').trim() ? esc(f[1]) : '—') + '</dd></div>'; }).join('') +
      '</dl></div>';
  }

  return { COLUMNAS: COLUMNAS, CAMPOS: CAMPOS, bloque: bloque, esc: esc };
})();
