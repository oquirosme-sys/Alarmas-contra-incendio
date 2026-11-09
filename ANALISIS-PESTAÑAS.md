# Variante «formato Notifier» · análisis de pestañas

Punto de partida: el libro `referencia/Notifier - Memoría de Alarma.xlsx` (5 pestañas) frente a la herramienta de Detección tal como está hoy (`deteccion.html` y `deteccion/`, copia sin cambios de la versión de SNG Electrical).

Este documento es el insumo para decidir qué pestañas se usan, cuáles se descartan y cuáles se reemplazan por lo que la herramienta ya hace. **Todavía no se cambió código.**

## 1. Qué hace el libro

| Pestaña | Contenido | Entradas | Salidas (fórmulas) |
|---|---|---|---|
| 1. Dispositivos | Corrientes (A) en espera y alarma de cada dispositivo, tensión mínima, y la tabla de cables (AWG, modelo, ohm/km, pF/m). Segunda tabla: dispositivos de notificación (SE15…SE185, E15…E185) con corriente NAC y de voceo. | Todas | Ninguna |
| 2. Paneles | Base de diseño (24 h espera, 15 min alarma, factor de seguridad 20 %, 24 V × 85 % = 20,4 V, parámetros de voceo), panel/transponder, fuentes remotas (RPS) y amplificadores. | Parámetros, nombre, modelo y nivel de cada equipo | Cantidad de lazos, corriente total, Ah en espera y en alarma, Ah + factor de seguridad |
| 3. Conteo dispositivos | Cantidad de cada tipo de dispositivo por nivel, y el total por lazo SLC (agrupa 3 niveles por lazo). | Cantidades por nivel | Sumas por lazo |
| 4. SLC + AUX | Un renglón por lazo: panel, lazo, niveles, cantidades, corriente, distancia, calibre. Comprobación del cableado SLC y del auxiliar +24 VDC. | Cantidades, distancia, calibre | Corriente, resistencia, caída, tensión disponible, «Cumple / No cumple» |
| 5. NAC + VOCEO | Un renglón por lazo NAC y por lazo de voceo: cantidades de altavoz con estrobo y de estrobo, potencia, distancia, calibre. | Cantidades, distancia, calibre | Corriente de alarma, caída, tensión disponible, pérdida de voceo (dB), estado |

## 2. Qué ya hace la herramienta

| Pestaña del libro | Equivalente en la herramienta | Cobertura |
|---|---|---|
| 1. Dispositivos | Catálogo de dispositivos y cables (Administración) | Completa y con más fabricantes. **Falta contrastar los valores** (ver 4). |
| 2. Paneles · base de diseño | Parámetros del proyecto: `tEspera` 24 h, `tAlarma` 15 min, `fs` 0,2, `vNominal` 24 V, `pctFinVida` 0,85, `vMin` 16 V | Idéntica. Los valores por defecto coinciden con el libro. |
| 2. Paneles · baterías | Pestaña de cada panel (`Calc.panel`, `Calc.bateria`): Ah en espera + Ah en alarma, por el factor de seguridad, y selección de batería comercial | Cubierta. La herramienta además propone la batería comercial. |
| 2. Paneles · fuentes y amplificadores | Pestañas de fuentes (`Calc.fuente`, `tipo` AMP) | Cubierta. |
| 3. Conteo dispositivos | Pestaña por nivel (`vistaNivel`) y «Resumen de dispositivos» (`resumenDispositivos`) | Cubierta por nivel. **Falta la agrupación por lazo SLC** como tabla propia. |
| 4. SLC + AUX | Pestaña «Caída de tensión» (`Calc.caida`), circuitos de tipo SLC, 24VDC y SLC+24V | Cubierta en el cálculo; **falta la presentación en el formato del libro** (un renglón por lazo con las cantidades por tipo). |
| 5. NAC + VOCEO | Pestaña «Caída de tensión», circuitos NAC, VOCEO y NAC+VOCEO; amplificadores | Cubierta en el cálculo; **falta la presentación**, y la pérdida de voceo en dB. |

Lo que la herramienta hace y el libro no: varios fabricantes, niveles y paneles ilimitados, segundo lazo por dispositivo, clase A/B, «alimentado por», diagrama unifilar y láminas 1100 × 750, memoria en PDF, Excel con formato, conflictos de edición entre usuarios y guardado en Supabase.

## 3. Propuesta de uso de las pestañas

| Pestaña | Propuesta | Razón |
|---|---|---|
| 1. Dispositivos | **No se usa como pestaña.** Se usa una vez, para contrastar los valores contra el catálogo. | El catálogo ya es la fuente. Una segunda tabla de dispositivos duplicaría el dato. |
| 2. Paneles | **No se usa como pestaña.** Base de diseño y baterías ya están. | Sin aporte. |
| 3. Conteo dispositivos | **Se analiza.** Candidata a vista del Resumen: cantidades por nivel y por lazo SLC. | Es la forma en que el equipo revisa cuántos dispositivos entran en cada lazo. |
| 4. SLC + AUX | **Se usa como formato de salida.** | Es el cuadro que se entrega: un renglón por lazo con cantidades, corriente, distancia, calibre y estado. |
| 5. NAC + VOCEO | **Se usa como formato de salida.** | Igual que la anterior, con la pérdida de voceo. |

Esta propuesta toma como candidatas las tres pestañas que quedaron marcadas en la captura (3, 4 y 5). **Hay que confirmarla.**

## 4. Diferencias de cálculo que hay que decidir

Se compararon las fórmulas del libro con `calc.js`. Donde difieren, la variante no puede ofrecer los dos resultados sin que se elija uno.

1. **Resistencia del lazo.** El libro calcula `R = ohm/km × distancia / 1000` (un solo sentido). La herramienta calcula `R = 2 × L / 1000 × ohm/km` (ida y vuelta). Con la misma distancia, la herramienta da el doble de caída. Hay que decidir cuál rige y qué significa la columna «Distancia (m)» del libro.
2. **Criterio de cumplimiento.** El libro dice «Cumple» si la tensión disponible es mayor que 16 V. La herramienta acepta mayor o igual, y además revisa que la corriente no pase de 2,4 A (80 % del NAC), que el libro no revisa.
3. **Corriente del lazo SLC.** El libro usa para la caída la corriente de alarma de todos los dispositivos del lazo. La herramienta suma la corriente de alarma de las filas asignadas al lazo. Es equivalente si las cantidades coinciden.
4. **Consumo del módulo de lazo.** El libro suma 0,159 A en espera y 0,21 A en alarma por cada módulo SLM-318 (uno por lazo) a la corriente del panel. En la herramienta eso solo se obtiene si el módulo está como renglón del panel. Hay que confirmar que el catálogo lo permita.
5. **Catálogo.** Modelos del libro que **no se encontraron por ese nombre** en `catalogo-base.js`: FSP-1, FST-1, SLM-318, HPF-PS10, HPF-PS6, BA-FIRE-AVDS-62174 y el cable 5320FL. Pueden existir con otro nombre (FSP-851, por ejemplo). Falta revisarlo uno por uno y comparar las corrientes.

## 5. Inconsistencias dentro del libro

Son una razón para que la variante calcule en la herramienta y deje el libro solo como formato.

- **3. Conteo.** La suma de cada lazo para DT está desfasada respecto a la de DH: `L5 = SUM(B11:B13)` pero `M5 = SUM(C12:C14)`; `M6 = SUM(C13:C15)` y `M7 = SUM(C16:C18)`. Los lazos 4 a 6 suman filas distintas según el tipo de dispositivo.
- **2. Paneles.** Muchas celdas de fuentes y amplificadores están escritas como número y no como fórmula (por ejemplo `F37:F40`, `G37:G40`, `G56`, `I58`). Si cambia una cantidad, esos totales no se actualizan.
- **2. Paneles.** La corriente en espera del panel (`I25`) solo suma el lazo SLC; la de alarma (`J25`) suma el lazo SLC más el NAC y el voceo. Es coherente, pero el auxiliar +24 VDC no entra en ninguna.
- **4. SLC + AUX.** Varias celdas de resistencia y de caída están en blanco o como número fijo (`S8:S12`, `T10:T12`, `V8:V12`). La resistencia del auxiliar usa `P × X` sin dividir entre 1000.
- **1. Dispositivos.** La corriente de voceo de los altavoces con estrobo es 0,0833 A (2 W a 24 V) en los siete modelos, pero solo SE15 y SE30 la traen como fórmula (`2/24`); el resto es un número escrito. Los estrobos solos (E15 a E185) tienen 0 en voceo.

## 6. Siguientes pasos propuestos

1. Confirmar la propuesta de la sección 3 y las cinco decisiones de la sección 4.
2. Contrastar la pestaña 1 con el catálogo (sección 4, punto 5) y completar lo que falte.
3. Agregar a la pestaña «Caída de tensión» una **vista en formato del libro**: un renglón por lazo SLC y por lazo NAC/voceo, con cantidades por tipo de dispositivo.
4. Agregar al Excel de la memoria las hojas «SLC + AUX» y «NAC + VOCEO» con ese formato, calculadas una sola vez (`memoriaDatos`) para que coincidan con el PDF.
5. Probar con el proyecto del libro (6 lazos SLC en FACP, 5 en el transponder, 14 amplificadores, 11 fuentes remotas) y comparar los resultados contra el libro, renglón por renglón.

## 7. Contenido de esta carpeta

| Ruta | Qué es |
|---|---|
| `deteccion.html`, `deteccion/` | Copia de la herramienta, sin cambios |
| `eva-ui.css`, `suite-*.css`, `acceso*.js`, `memoria-sinergia.js`, `excel-sinergia.js`, `datos-proyecto.js`, `img/` | Archivos compartidos que la herramienta necesita |
| `referencia/Notifier - Memoría de Alarma.xlsx` | El libro de origen |
| `ANALISIS-PESTAÑAS.md` | Este documento |

La herramienta depende de Supabase y de la sesión de la Suite (`acceso.js`, `acceso-config.js`): sin ellos no abre. Para probar en local hace falta el servidor de pruebas con el `acceso.js` simulado.
