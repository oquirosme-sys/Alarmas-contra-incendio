/* ============================================================
   Excel Sinergia · libro con formato de entregable
   ------------------------------------------------------------
   Mismo criterio que memoria-sinergia.js, llevado a Excel (SkillFormato):
     · Hoja carta, margenes de 1.5 cm a los lados, encabezado con la razón social
       y pie de tres celdas (nombre del documento, web y correo, número de página).
     · Montserrat 9 pt. Títulos de tabla centrados y numerados («Tabla No. N»).
     · Tablas: reglas horizontales nada más (gruesa arriba y debajo del encabezado,
       hairline entre filas), sin relleno, encabezado en redonda, unidades en el
       encabezado, cifras a la derecha con el mismo número de decimales por columna,
       ninguna celda en blanco (un solo marcador: «—»).
     · Totales como fórmulas vivas (SUM) con su resultado ya calculado.
     · Color solo en la criticidad, y solo en la palabra.
   Requiere internet al exportar (ExcelJS desde cdnjs).

   Una tabla se describe con:
     { titulo, procedencia, cols:[{h, a:'izq'|'der', d:decimales|null}], filas:[[…]],
       total:[índices de columnas a sumar] | null, totalEtiqueta, totalExtra:{índice: valor}, nota }
   Los números van como número; el texto, como texto; null o '' se escribe con el marcador.
   ============================================================ */
window.ExcelSinergia = (function () {
  'use strict';

  var MARCA = '—';
  var FUENTE = 'Montserrat';
  var NEGRO = 'FF000000', GRIS = 'FF808080', ROJO = 'FFA8281E', AMBAR = 'FF8A5A0B';
  var EXCELJS = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';

  function cargar() {
    if (window.ExcelJS) return Promise.resolve();
    return new Promise(function (ok, mal) {
      var s = document.createElement('script');
      s.src = EXCELJS; s.onload = ok;
      s.onerror = function () { mal(new Error('No se pudo cargar ExcelJS (revise la conexión a internet).')); };
      document.head.appendChild(s);
    });
  }
  function fnt(o) { return Object.assign({ name: FUENTE, size: 9, color: { argb: NEGRO } }, o || {}); }
  function fmtNum(d) { return d ? '#,##0.' + new Array(d + 1).join('0') : '#,##0'; }
  function letra(i) {                       // 1 -> A, 27 -> AA
    var s = ''; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
    return s;
  }
  function vacio(v) { return v === null || v === undefined || (typeof v === 'string' && v.trim() === '') || (typeof v === 'number' && isNaN(v)); }

  /* opts: { autor, docNombre, titulo, fecha } */
  async function libro(opts) {
    await cargar();
    var wb = new ExcelJS.Workbook();
    wb.creator = opts.autor || 'Sinergia'; wb.created = opts.fecha || new Date(); wb.title = opts.titulo || opts.docNombre;
    var n = 0;                                  // numeración correlativa de tablas en todo el libro
    var grueso = { style: 'medium', color: { argb: NEGRO } };
    var fino = { style: 'hair', color: { argb: 'FF9A9A9A' } };
    var pie = '&8&"Montserrat,Regular"&K808080' + opts.docNombre + '&C&K385623www.sinergia.co.cr · info@sinergia.co.cr&R&K808080Página &P de &N';
    var cabecera = '&L&8&"Montserrat,Regular"Sinergia Consultoría Mecánica y Eléctrica S.A&R&8Oficentro Plaza Roble, Edificio Pórtico, Escazú';

    /* anchos: ancho de cada columna en caracteres de Excel */
    function hoja(nombre, cfg) {
      cfg = cfg || {};
      var ws = wb.addWorksheet(nombre);
      cfg.anchos.forEach(function (w, i) { ws.getColumn(i + 1).width = w; });
      var fila = 1, primeraEnc = null;

      function pagina() {
        ws.pageSetup = {
          paperSize: 1, orientation: cfg.apaisada ? 'landscape' : 'portrait',      // carta
          fitToPage: true, fitToWidth: 1, fitToHeight: 0,
          margins: { left: 0.59, right: 0.59, top: 0.98, bottom: 0.98, header: 0.49, footer: 0.79 }   // 1.5 / 2.5 / 1.25 / 2.0 cm
        };
        ws.headerFooter = { oddHeader: cabecera, oddFooter: pie };
        if (cfg.repetirEncabezado && primeraEnc) ws.pageSetup.printTitlesRow = primeraEnc + ':' + primeraEnc;
        ws.views = [cfg.repetirEncabezado && primeraEnc
          ? { state: 'frozen', ySplit: primeraEnc, showGridLines: false } : { showGridLines: false }];
      }

      var api = {
        ws: ws,
        titulo: function (t) {
          var c = ws.getCell(fila, 1); c.value = t; c.font = fnt({ bold: true, size: 14 }); fila += 2; return api;
        },
        dato: function (rotulo, valor, negrita) {
          var a = ws.getCell(fila, 1), b = ws.getCell(fila, 2);
          a.value = rotulo; a.font = fnt({ color: { argb: GRIS } });
          b.value = vacio(valor) ? MARCA : String(valor); b.font = fnt({ bold: !!negrita }); b.alignment = { horizontal: 'left' };
          fila++; return api;
        },
        espacio: function () { fila++; return api; },
        parrafo: function (t, alto) {                          // texto corrido, combinado a todo el ancho
          var nc = cfg.anchos.length;
          ws.mergeCells(fila, 1, fila, nc);
          var c = ws.getCell(fila, 1); c.value = t; c.font = fnt({ size: 10 });
          c.alignment = { wrapText: true, vertical: 'top', horizontal: 'justify' };
          var ancho = cfg.anchos.reduce(function (s, w) { return s + w; }, 0);
          ws.getRow(fila).height = alto || Math.max(15, Math.ceil(String(t).length / (ancho * 1.05)) * 14);
          fila++; return api;
        },
        h2: function (t) { var c = ws.getCell(fila, 1); c.value = t; c.font = fnt({ bold: true, size: 11 }); fila++; return api; },
        nota: function (t) {
          var nc = cfg.anchos.length;
          ws.mergeCells(fila, 1, fila, nc);
          var c = ws.getCell(fila, 1); c.value = t; c.font = fnt({ color: { argb: GRIS } });
          c.alignment = { wrapText: true, vertical: 'top' }; ws.getRow(fila).height = 28; fila++; return api;
        },

        /* Tabla numerada. Devuelve { n, filaEnc, primera, ultima }. */
        tabla: function (T) {
          n++;
          var cols = T.cols, nc = cols.length;
          var cel = function (r, c) { return ws.getCell(r, c); };
          // título (dos líneas, centrado) y procedencia
          ws.mergeCells(fila, 1, fila, nc); ws.mergeCells(fila + 1, 1, fila + 1, nc);
          cel(fila, 1).value = 'Tabla No. ' + n; cel(fila + 1, 1).value = T.titulo;
          cel(fila, 1).font = cel(fila + 1, 1).font = fnt({ bold: true });
          cel(fila, 1).alignment = cel(fila + 1, 1).alignment = { horizontal: 'center', vertical: 'middle' };
          fila += 2;
          if (T.procedencia) {
            ws.mergeCells(fila, 1, fila, nc);
            cel(fila, 1).value = T.procedencia; cel(fila, 1).font = fnt({ italic: true, color: { argb: GRIS } });
            cel(fila, 1).alignment = { horizontal: 'center' }; fila++;
          }
          // encabezado: redonda, caja baja, sin relleno
          var filaEnc = fila; if (!primeraEnc) primeraEnc = filaEnc;
          cols.forEach(function (c, i) {
            var x = cel(fila, i + 1);
            x.value = c.h; x.font = fnt();
            x.alignment = { horizontal: c.a === 'der' ? 'right' : 'left', vertical: 'bottom', wrapText: true };
            x.border = { top: grueso, bottom: grueso };
          });
          ws.getRow(fila).height = 30; fila++;
          // cuerpo
          var primera = fila, filas = T.filas;
          filas.forEach(function (f, k) {
            var alto = 15;
            f.forEach(function (v, i) {
              var x = cel(fila, i + 1), col = cols[i];
              var esNum = typeof v === 'number' && !isNaN(v);
              x.value = vacio(v) ? MARCA : v;
              x.font = fnt(col.color && !vacio(v) ? { color: { argb: col.color(v) } } : {});
              x.alignment = { horizontal: col.a === 'der' ? 'right' : 'left', vertical: 'top', wrapText: !esNum };
              if (esNum) x.numFmt = fmtNum(col.d || 0);
              x.border = { top: k === 0 ? undefined : fino, bottom: (k === filas.length - 1 && !T.total) ? grueso : undefined };
              if (!esNum && typeof v === 'string') {
                var ancho = cfg.anchos[i] || 10;
                alto = Math.max(alto, Math.ceil(v.length / (ancho * 1.05)) * 13 + 3);
              }
            });
            ws.getRow(fila).height = alto; fila++;
          });
          var ultima = fila - 1;
          // total con fórmulas vivas
          if (T.total && filas.length) {
            cols.forEach(function (c, i) {
              var x = cel(fila, i + 1);
              if (i === 0) x.value = T.totalEtiqueta || 'Total';
              else if (T.total.indexOf(i) >= 0) {
                var suma = filas.reduce(function (s, f) { return s + (typeof f[i] === 'number' ? f[i] : 0); }, 0);
                x.value = { formula: 'SUM(' + letra(i + 1) + primera + ':' + letra(i + 1) + ultima + ')', result: suma };
                x.numFmt = fmtNum(c.d || 0);
              } else if (T.totalExtra && !vacio(T.totalExtra[i])) {
                x.value = T.totalExtra[i]; x.numFmt = fmtNum(c.d || 0);        // valores propios del total (p. ej. máximos)
              } else x.value = MARCA;
              x.font = fnt({ bold: true });
              x.alignment = { horizontal: c.a === 'der' ? 'right' : 'left' };
              x.border = { top: { style: 'thin', color: { argb: NEGRO } }, bottom: grueso };
            });
            fila++;
          }
          if (T.nota) api.nota(T.nota);
          fila++;                                              // aire entre tablas
          return { n: n, filaEnc: filaEnc, primera: primera, ultima: ultima };
        },
        pagina: pagina
      };
      return api;
    }

    async function descargar(nombre) {
      var buf = await wb.xlsx.writeBuffer();
      var url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      var a = document.createElement('a'); a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    }
    return { hoja: hoja, descargar: descargar, workbook: wb, colorCriticidad: function (v) { return v === 'Crítico' ? ROJO : v === 'Observación' ? AMBAR : NEGRO; } };
  }

  return { libro: libro, MARCA: MARCA };
})();
