/* ============================================================
   Memoria Sinergia · documento imprimible / PDF
   ------------------------------------------------------------
   Un solo constructor para todas las herramientas del módulo, de modo que
   ninguna reinvente el formato:

   FORMATO (SkillFormato)
     · Carta, márgenes 3.0 cm (lados) y 2.5 cm (arriba y abajo, que el encabezado y el pie empujan a 3.4 y 3.0 cm).
       Se arman con margen de página de 1.35 cm + 1.65 cm de relleno del
       contenido: el relleno es área pintable y el margen no.
     · Encabezado en cada página: logo de 5.7 × 2.0 cm a 1.25 cm del borde,
       que invade el margen izquierdo a propósito, y el bloque de dos líneas a 8 pt.
     · Pie de tres celdas a 8 pt (31 / 38 / 31 %): nombre del documento en gris,
       web y correo en verde, número de página en gris.
     · Montserrat 11 pt, interlínea 1.08, 8 pt después de párrafo, justificado.
     · Títulos de sección en negrita, caja baja, negro, sin regla.
     · Tablas: título encima, centrado y numerado (Tabla No. N), reglas
       horizontales nada más, encabezado en redonda, anchos declarados, cifras
       a la derecha, unidad en el encabezado, ninguna celda en blanco, un solo
       marcador de «sin dato» por documento y el encabezado repetido en cada página.
     · Color solo en la criticidad, y solo en la palabra.
     · Una tabla ancha va en una sección apaisada, nunca bajando de 8 pt.

   REDACCIÓN (SkillRedaccion)
     · El texto lo escribe cada herramienta con este constructor: voz impersonal
       con «se», hecho · contraste · consecuencia · acción con responsable,
       alcance acotado y cierre que devuelve la decisión final a quien ejecuta.
   ============================================================ */
window.MemoriaSinergia = (function () {
  'use strict';

  var MARCA = '—';                  // «el dato aplica pero no se conoce»; el único marcador del documento
  var ANCHO_V = 15.59, ANCHO_H = 21.94;   // ancho útil de texto (cm), vertical y apaisada

  /* ---------- utilidades ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Mismo número de decimales en toda la columna; sin dato -> marcador
  function num(n, d) {
    if (n === null || n === undefined || n === '' || isNaN(n)) return MARCA;
    return Number(n).toLocaleString('es-CR', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function texto(v) { return (v === null || v === undefined || String(v).trim() === '') ? MARCA : String(v); }
  function fechaTxt(d) {
    return (d || new Date()).toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' });
  }
  function nombreArchivo(partes, ext) {
    return partes.filter(Boolean).join('_').replace(/[^\w-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') + '.' + ext;
  }

  /* ---------- hoja de estilo ---------- */
  function css(docNombre, logo) {
    var q = function (s) { return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"'); };
    var fuente = '8pt Montserrat, sans-serif';
    var cajas = function (w) {   // w: [izq, centro, der] de las celdas del pie y [izq, der] del encabezado, en cm
      return [
        ' @top-left{content:"";width:' + w.sup[0] + 'cm;background:url("' + q(logo) + '") no-repeat 0 1.25cm / 5.7cm 2cm}',
        ' @top-right{content:"Sinergia Consultoría Mecánica y Eléctrica S.A\\A Oficentro Plaza Roble, Edificio Pórtico, Escazú";white-space:pre;font:400 ' + fuente + ';line-height:1.3;color:#000;text-align:right;vertical-align:top;padding:1.35cm 1.65cm 0 0;width:' + w.sup[1] + 'cm}',
        ' @bottom-left{content:"' + q(docNombre) + '";font:400 ' + fuente + ';color:#808080;width:' + w.inf[0] + 'cm;padding:0 0 2cm 1.65cm;text-align:left;vertical-align:bottom;white-space:nowrap}',
        ' @bottom-center{content:"www.sinergia.co.cr\\Ainfo@sinergia.co.cr";white-space:pre;font:400 ' + fuente + ';color:#385623;width:' + w.inf[1] + 'cm;padding-bottom:2cm;text-align:center;vertical-align:bottom}',
        ' @bottom-right{content:counter(page);font:400 ' + fuente + ';color:#808080;width:' + w.inf[2] + 'cm;padding:0 1.65cm 2cm 0;text-align:right;vertical-align:bottom}'
      ].join('\n');
    };
    return [
      // 31 / 38 / 31 % del texto (15.59 cm) = 4.83 / 5.92 / 4.83, más 1.65 cm de relleno a cada lado
      '@page{size:letter;margin:3.4cm 1.35cm 3cm 1.35cm;\n' + cajas({ sup: [9, 9.89], inf: [6.48, 5.92, 6.48] }) + '}',
      // 31 / 38 / 31 % de 21.94 cm = 6.80 / 8.34 / 6.80
      '@page apaisada{size:letter landscape;margin:3.4cm 1.35cm 3cm 1.35cm;\n' + cajas({ sup: [9, 16.24], inf: [8.45, 8.34, 8.45] }) + '}',
      '*{box-sizing:border-box}',
      'html,body{margin:0;padding:0}',
      'body{padding:0 1.65cm;font:400 11pt/1.08 Montserrat,sans-serif;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      'h1{font:700 17pt/1.2 Montserrat,sans-serif;margin:0 0 4pt}',
      '.sub{font-size:11pt;margin:0 0 12pt}',
      'h2{font:700 12pt/1.25 Montserrat,sans-serif;margin:16pt 0 6pt;break-after:avoid}',
      'p{margin:0 0 8pt;text-align:justify;orphans:2;widows:2}',
      'p:has(+ .cuadro-tit){break-after:avoid}',
      'ul{margin:0 0 8pt;padding-left:1.1cm;text-align:justify}li{margin-bottom:3pt}',
      '.dato{margin:0 0 3pt;text-align:left;font-size:10pt}.dato .r{color:#808080;display:inline-block;width:3.2cm}',
      '.apaisada{page:apaisada;break-before:page}',
      '.cuadro-tit{text-align:center;font-size:10pt;margin:14pt 0 2pt;break-after:avoid;font-weight:700}',
      '.cuadro-proc{text-align:center;font-size:8.5pt;color:#808080;margin:0 0 5pt;break-after:avoid}',
      'table.cuadro{border-collapse:collapse;table-layout:fixed;border-top:1.5px solid #000;border-bottom:1.5px solid #000;margin:0 0 4pt;font-size:9pt;line-height:1.25}',
      '.cuadro th{font-weight:400;padding:.18cm .15cm;border-bottom:1.2px solid #000;vertical-align:bottom}',
      '.cuadro td{padding:.16cm .15cm;vertical-align:top;overflow-wrap:break-word;font-variant-numeric:tabular-nums}',
      '.cuadro tbody tr+tr td{border-top:.5px solid #bdbdbd}',
      '.cuadro .izq{text-align:left}.cuadro .der{text-align:right}',
      '.cuadro thead{display:table-header-group}.cuadro tr{break-inside:avoid}',
      '.cuadro tr.total td{border-top:1.2px solid #000;font-weight:700}',
      '.nota{font-size:8.5pt;margin:2pt 0 10pt;text-align:left}',
      '.hallazgo{break-inside:avoid;border-top:.5px solid #bdbdbd;padding-top:5pt;margin-top:3pt}',
      '.hallazgo .cod{font-weight:700;margin:0 0 2pt;text-align:left}',
      '.figura{margin:4pt auto 8pt;break-inside:avoid}.figura svg{width:100%;height:auto;display:block}',
      '.crit{color:#A8281E}.obs{color:#8A5A0B}'
    ].join('\n');
  }

  /* ---------- constructor del documento ---------- */
  // opts: { docNombre, titulo, subtitulo, datos:[[rótulo, valor], …], logo }
  function nuevo(opts) {
    var partes = [], n = 0, nf = 0;
    var logo = opts.logo || 'img/sinergia-logo.jpg';

    var api = {
      MARCA: MARCA,
      h2: function (t) { partes.push('<h2>' + esc(t) + '</h2>'); return api; },
      p: function (t) { partes.push('<p>' + esc(t) + '</p>'); return api; },
      lista: function (items) { partes.push('<ul>' + items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>'); return api; },
      /* Tabla numerada. t: { titulo, procedencia, anchos (cm), cabeceras, alin ('izq'|'der'), filas, total, nota, apaisada, encabezado }
         `encabezado` (solo con apaisada) abre la sección apaisada con un título, p. ej. «Anexos».
         Ninguna celda queda en blanco: lo vacío se escribe con el marcador. */
      tabla: function (t) {
        n++;
        var ancho = t.anchos.reduce(function (s, a) { return s + a; }, 0);
        var limite = t.apaisada ? ANCHO_H : ANCHO_V;
        if (ancho > limite + 0.05) throw new Error('Tabla No. ' + n + ': los anchos suman ' + ancho.toFixed(2) + ' cm y caben ' + limite);
        var celda = function (v, i) { return '<td class="' + t.alin[i] + '">' + esc(texto(v)) + '</td>'; };
        var h = '<p class="cuadro-tit">Tabla No. ' + n + '<br>' + esc(t.titulo) + '</p>';
        if (t.procedencia) h += '<p class="cuadro-proc">' + esc(t.procedencia) + '</p>';
        h += '<table class="cuadro" style="width:' + ancho + 'cm"><colgroup>' +
          t.anchos.map(function (a) { return '<col style="width:' + a + 'cm">'; }).join('') + '</colgroup>';
        h += '<thead><tr>' + t.cabeceras.map(function (c, i) { return '<th class="' + t.alin[i] + '">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
        t.filas.forEach(function (f) { h += '<tr>' + f.map(celda).join('') + '</tr>'; });
        if (t.total) h += '<tr class="total">' + t.total.map(celda).join('') + '</tr>';
        h += '</tbody></table>';
        if (t.nota) h += '<p class="nota">' + esc(t.nota) + '</p>';
        var ult = partes.length - 1;
        if (t.apaisada && ult >= 0 && partes[ult].indexOf('<section class="apaisada">') === 0) {
          // las tablas apaisadas consecutivas comparten sección (y hoja)
          partes[ult] = partes[ult].slice(0, -'</section>'.length) + h + '</section>';
        } else {
          partes.push(t.apaisada ? '<section class="apaisada">' + (t.encabezado ? '<h2>' + esc(t.encabezado) + '</h2>' : '') + h + '</section>' : h);
        }
        return api;
      },
      /* Figura numerada con un SVG en línea. f: { titulo, procedencia, svg, ancho (cm, hasta 15.59), nota }
         El título va arriba, centrado, como el de las tablas. */
      figura: function (f) {
        nf++;
        var ancho = Math.min(f.ancho || ANCHO_V, ANCHO_V);
        var h = '<p class="cuadro-tit">Figura No. ' + nf + '<br>' + esc(f.titulo) + '</p>';
        if (f.procedencia) h += '<p class="cuadro-proc">' + esc(f.procedencia) + '</p>';
        h += '<div class="figura" style="width:' + ancho + 'cm">' + f.svg + '</div>';
        if (f.nota) h += '<p class="nota">' + esc(f.nota) + '</p>';
        partes.push(h);
        return api;
      },
      /* Hallazgo: entrada con código propio, no una fila. criticidad: 'Crítico' | 'Observación' */
      hallazgo: function (h) {
        var clase = h.criticidad === 'Crítico' ? 'crit' : 'obs';
        partes.push('<div class="hallazgo"><p class="cod">' + esc(h.codigo) + ' · <span class="' + clase + '">' + esc(h.criticidad) + '</span></p><p>' + esc(h.texto) + '</p></div>');
        return api;
      },
      numeroDeTablas: function () { return n; },
      html: function () {
        var datos = (opts.datos || []).map(function (d) {
          return '<p class="dato"><span class="r">' + esc(d[0]) + '</span>' + esc(texto(d[1])) + '</p>';
        }).join('');
        return '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>' + esc(opts.docNombre) + '</title>' +
          '<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,700&display=swap" rel="stylesheet">' +
          '<style>' + css(opts.docNombre, logo) + '</style></head><body>' +
          '<h1>' + esc(opts.titulo) + '</h1>' +
          (opts.subtitulo ? '<p class="sub">' + esc(opts.subtitulo) + '</p>' : '') + datos +
          partes.join('') + '</body></html>';
      }
    };
    return api;
  }

  /* Imprime en un iframe oculto: la pantalla de la aplicación no se toca.
     Se espera a las fuentes y al logo, o el PDF sale sin Montserrat. */
  function imprimir(html, nombreDoc) {
    return new Promise(function (ok, mal) {
      var fr = document.createElement('iframe');
      fr.setAttribute('aria-hidden', 'true');
      fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
      fr.srcdoc = html;
      fr.onload = function () {
        var w = fr.contentWindow, d = fr.contentDocument;
        var fuentes = d.fonts && d.fonts.ready ? d.fonts.ready : 0;
        // el logo va en el CSS de la página: se precarga para que esté listo al imprimir
        var logo = new Promise(function (r) { var i = new Image(); i.onload = i.onerror = r; i.src = 'img/sinergia-logo.jpg'; });
        Promise.all([fuentes, logo]).then(function () {
          setTimeout(function () {
            var titulo = document.title; document.title = nombreDoc.replace(/\.pdf$/, '');
            w.focus(); w.print();
            document.title = titulo;
            setTimeout(function () { fr.remove(); ok(); }, 1500);
          }, 150);
        }).catch(mal);
      };
      document.body.appendChild(fr);
    });
  }

  return { nuevo: nuevo, imprimir: imprimir, esc: esc, num: num, texto: texto, fechaTxt: fechaTxt, nombreArchivo: nombreArchivo, MARCA: MARCA };
})();
