# Contexto del proyecto: REY CENTRAL GRUAS

## Estado actual

Landing page en espanol para renta de grua con canastilla en CDMX y cobertura nacional. La unica ruta publica actual es `/`. La experiencia prioriza la solicitud de cotizacion guiada, la evaluacion previa de condiciones del sitio y el contacto por WhatsApp cuando el numero del negocio este configurado.

El repositorio tiene cambios locales sin publicar. No se realizo commit, push ni despliegue durante esta sesion.

## Arquitectura

- Framework: TanStack Start con TanStack Router, React 19, TypeScript y Vite.
- Estilos: Tailwind CSS 4 y estilos globales en `src/styles.css`.
- UI: componentes locales en `src/components/site/` y componentes Radix en `src/components/ui/`.
- Datos de negocio y flota: `src/config/business.ts`.
- Imagenes de referencia de servicios: `src/config/referenceImages.ts` y `src/assets/reference/`.
- Entrada SSR/Cloudflare: `src/server.ts`. El endpoint `POST /api/analyze-images` realiza el preanalisis visual solo si existe el binding de Workers AI; no guarda imagenes.
- Rutas: `src/routes/__root.tsx` provee el documento HTML, accesibilidad base y `QueryClientProvider`; `src/routes/index.tsx` implementa la portada.
- Despliegue objetivo: preset `cloudflare-module` de Nitro. El build genera `.output/` y configuracion de Wrangler.

## Estructura funcional

- `SiteHeader`: header sticky con navegacion por anclas, menu movil, estado activo por `IntersectionObserver` y modo compacto al hacer scroll.
- Hero: marca, propuesta de valor, beneficios y accesos a cotizacion y flota.
- Llamado principal y barra de confianza.
- Seccion de seguridad y evaluacion previa.
- Flota seleccionable de tres unidades; la unidad seleccionada alimenta el cotizador mediante `?unidad=<nombre>#cotizar`.
- Servicios: muestra inicialmente tres y permite expandir el catalogo completo.
- Seccion de razones para elegir el servicio.
- Cobertura nacional, ubicada antes del cotizador.
- `QuoteWizard`: formulario de cinco pasos, persistencia temporal de respuestas en `sessionStorage`, fotos locales, consentimiento explicito y preanalisis opcional con IA.
- Footer con informacion de contacto y enlaces internos.
- `Assistant`: menu flotante de ayuda que dirige a anclas internas o a WhatsApp si esta configurado.

## Modificaciones implementadas

- Se elimino la seccion FAQ y el componente `src/components/ui/accordion.tsx` que se utilizaba exclusivamente para ella.
- Se elimino el CTA final redundante de "Atencion directa".
- Se agrego la seccion de cobertura nacional antes de Cotizacion.
- Se creo la seccion de flota de tres tarjetas con seleccion de unidad, ficha resumida y CTA de cotizacion por unidad.
- Se adaptaron datos de negocio, servicios, mensajes de WhatsApp y entidades para soportar la seleccion de unidad y el flujo de cotizacion.
- Se incorporaron los recursos de marca y la fotografia real de la grua.
- Se rediseño el inicio en dos bloques consecutivos con scroll natural: Hero industrial y beneficios/categorias, sin crear otra ruta ni modificar el flujo posterior de flota, servicios detallados, cobertura o cotizador.
- El Hero usa una textura SVG de placa de acero diamantado autentica, densa y oscura con reflejos azul carbon; incorpora placas cepilladas con remaches circulares en los extremos, un marco angular metalico con borde naranja, notch central-izquierdo visible y acentos naranja moderados. Conserva el logo original sin tarjeta contenedora y presenta `A la altura de tus proyectos`, el distintivo `Renta de grúas`, el subtitulo `Seguridad, precisión y confianza` y el CTA `Ver equipos` hacia `#unidad`, con espaciado vertical compacto.
- La fotografia aprobada se presenta en el marco angular usando los recursos originales. Las bandas negras laterales del lienzo se ocultan solo mediante `object-cover` centrado, sin recortar archivos, sin alterar pixeles, sin filtros ni deformacion; grua, canastilla, trabajadores, estabilizadores, pavimento y letrero se conservan completos.
- La segunda seccion mantiene el lenguaje metalico con textura mas tenue: franja Seguridad/Eficiencia/Flexibilidad, tres categorias de aplicaciones de las gruas y banner `Elevamos tus soluciones`. Las categorias aclaran que la empresa renta el equipo y no ejecuta instalaciones especializadas.
- El `SiteHeader` es inteligente: oculta el logo pequeno mientras el logo del Hero es visible y lo muestra al salir de este mediante `IntersectionObserver`. Su CTA de WhatsApp es verde y permanece disponible: completo en escritorio y como boton con etiqueta accesible en movil.
- Se compacto el espaciado vertical de bandas, secciones, Hero, llamado principal, flota, cobertura y footer, con reducciones puntuales de hasta 30% en los bloques principales.
- Se agregaron dos detalles industriales SVG discretos: una grua de linea en el panel de Cobertura y otra en el footer.
- Se cambio el eyebrow de la seccion de razones de "Atencion directa" a "Confianza" para no confundirlo con la seccion eliminada.

## Decisiones UX/UI

- Lenguaje visual industrial sobrio: acero azul carbon, naranja, blanco y grises; se evitan efectos pesados y se reservan los acentos luminosos para CTAs y detalles de estructura.
- Paleta principal del Hero: `#07101E`, `#0B1736`, `#FF8A00`, `#FFFFFF` y grises acero.
- La foto principal usa `object-cover` centrado en el marco angular: oculta solo las bandas negras del lienzo, no estira la imagen y conserva el contenido aprobado.
- Los detalles decorativos del Hero son una textura SVG de placa diamantada densa (tile 160 x 80, fondo `#081522`), placas cepilladas horizontales con cuatro remaches circulares en los extremos, una transicion angular de acero y un marco angular metalico con borde naranja y notch central-izquierdo; no modifican el contenido fotografico.
- Los detalles industriales de Cobertura y footer se limitan a dos trazos SVG de baja opacidad para no competir con el contenido ni introducir decoracion caricaturesca.
- Las transiciones existentes respetan `prefers-reduced-motion` donde corresponde.
- Se conserva navegacion por anclas accesible: el objetivo recibe foco tras navegar y el contenido principal incluye enlace de salto.
- El overflow horizontal de la pagina se recorta, no se convierte en un contenedor con scroll, para mantener el header sticky ligado al viewport.
- El cotizador explica que la IA es orientativa, requiere consentimiento antes del envio y nunca sustituye la revision humana.

## Recursos graficos

- Logo definitivo: `public/assets/logo-rey-central-gruas.png` y su WebP sin perdida (1536 x 1024, con transparencia), renderizado por `src/components/site/BrandLogo.tsx`.
- Foto aprobada principal y de Unidad 01: `public/assets/grua-final-rey-central.png` y su WebP optimizado (1148 x 1371), copiada intacta desde `~/Downloads/GRUA_FINAL_REY_CENTRAL.png`.
- Recursos industriales independientes en `public/assets/industrial/`: `steel-diamond-plate.svg` (tile seamless denso de placa diamantada, 160 x 80), `brushed-steel-plate.svg` (placa cepillada con remaches redondos), `photo-frame-angular.svg` (marco angular metalico con notch central-izquierdo y acentos naranjas) y `metal-separator.svg` (separador metalico con luz naranja discreta). Son SVG geometricos autocontenidos, escalables y sin dependencia de una captura del mockup.
- No se invento una textura fotografica: la placa diamantada se resolvio como SVG con gradientes y sombras. Si se requiere una foto real de placa de acero para maxima fidelidad, queda como recurso pendiente opcional en WebP.
- Alternativas de logo disponibles en `public/`: `rey-central-gruas-exacto.svg` y `rey-central-gruas-profesional-sin-corona-v3.png`.
- Imagenes de referencia no necesariamente propias del negocio: `src/assets/reference/*.webp`, centralizadas en `src/config/referenceImages.ts`. Deben sustituirse por fotografias reales cuando esten disponibles.

## Archivos modificados locales

Los cambios locales detectados antes de crear este documento incluyen:

- `src/components/site/Assistant.tsx`
- `src/components/site/BrandLogo.tsx`
- `src/components/site/QuoteWizard.tsx`
- `src/components/site/SiteHeader.tsx`
- `src/components/site/ui.tsx`
- `src/components/ui/accordion.tsx` (eliminado)
- `src/config/business.ts`
- `src/config/referenceImages.ts`
- `src/lib/integrations.ts`
- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/styles.css`
- `src/types/entities.ts`
- `src/lib/cloudflare-workers-shim.ts` (nuevo, sin seguimiento en Git al momento de este documento)
- Recursos nuevos sin seguimiento en `public/`: logo, fotografia de grua y variantes de logo descritas arriba.
- `CONTEXTO_PROYECTO.md` (este documento).

## Datos pendientes y tareas futuras

- Configurar datos reales en `src/config/business.ts`: nombre comercial final si cambia, numero de WhatsApp, telefono, correo y horarios. Actualmente se muestran marcadores de "Por confirmar" y WhatsApp se deja vacio intencionalmente.
- Completar fichas tecnicas, fotos y caracteristicas verificadas de Unidades 02 y 03.
- Sustituir las imagenes de referencia por fotografias propias del negocio cuando existan.
- Implementar la consulta real de cobertura; el formulario actual evita el submit y solo comunica que se confirmara disponibilidad.
- Publicar aviso de privacidad y terminos.
- Realizar una revision visual humana final del Hero antes de publicar, especialmente del recorte inferior de la fotografia vertical; la validacion automatizada de layout ya se ejecuto en 1440x900, 1280x900, 1024x800, 768x900, 430x844 y 390x844.
- Si se reintroduce una FAQ, usar el acordeon Radix compartido para conservar navegacion por teclado y semantica de estado expandido.
- Considerar pruebas adicionales para seleccion de flota, flujo del cotizador, anclas y endpoint de analisis de imagenes.

## Pruebas ejecutadas

Ejecutadas durante la sesion actual:

- `bun run test`: correcto; 1 archivo de prueba y 1 prueba aprobada.
- `bun run build`: correcto; build cliente, SSR y Nitro completados.
- `git diff --check -- src/routes/index.tsx src/styles.css`: correcto, sin errores de espacios.
- Verificacion local por HTTP: `http://127.0.0.1:8081/`, `/logo-rey-central-gruas.png` y `/grua-real.png` respondieron correctamente mientras el servidor local estaba activo.
- Revalidacion al cerrar este documento: `bun run test` y `bun run build` volvieron a pasar; `git diff --check` limitado a `src`, `public`, `package.json`, `AGENTS.md` y este documento no reporto errores; la portada y ambos recursos respondieron por HTTP.
- Dimensiones verificadas de los recursos: logo 1536 x 1024 y fotografia de grua aprobada 1148 x 1371.
- Validacion final tras ajustes de espaciado y detalles industriales: `bun run test` (1 prueba aprobada), `bun run build` (cliente, SSR y Nitro correctos) y `git diff --check` acotado a `src/routes/index.tsx`, `src/styles.css` y `src/components/site/ui.tsx` sin errores.
- Optimizacion final del Hero: `bun run test` (1 prueba aprobada), `bun run build` (cliente, SSR y Nitro correctos) y `git diff --check` acotado a `src/routes/index.tsx`, `src/styles.css` y este documento sin errores.
- `bun run lint`: falla por errores de formato Prettier preexistentes en multiples archivos del repositorio; no se reformateo el proyecto completo para evitar un diff ajeno a esta tarea.
- Rediseño industrial final: validado en 1440, 1280, 1024, 768, 430 y 390 px. El Hero y la segunda seccion no presentan overflow; la foto usa los recursos originales con `object-cover` centrado; Header y CTA verde de WhatsApp cambian correctamente entre logo Hero visible y scroll compacto.
- Validacion final del Hero industrial continuo: 1440 x 900 (Hero 699 px, marco 464 x 643, CTA inferior en 689 px), 1024 x 900 (Hero 672 px, marco 445 x 616, CTA inferior en 654 px), 768 x 900 (Hero 1141 px, foto apilada bajo el contenido), 390 x 900 (Hero 954 px, marco 358 x 496). Sin overflow horizontal y con `Ver equipos` visible sin scroll en escritorio.
- Header inteligente validado en esos breakpoints: logo pequeno oculto en la parte superior y visible al salir el logo Hero; menu movil, foco y navegacion por anclas se mantienen operativos.

Nota: el repositorio tiene `node_modules` versionado, por lo que `git diff --check` sin filtro reporta espacios en dependencias y artefactos de build ajenos a los cambios del proyecto. La validacion relevante debe hacerse con rutas acotadas.

El build informa un aviso no bloqueante de Vite sobre `vite-tsconfig-paths`; no afecta la compilacion actual.

## Restricciones importantes

- No reescribir historial publicado: no usar force push, rebase, amend ni squash de commits ya publicados. El proyecto esta conectado a Lovable.
- Mantener el proyecto funcional antes de cualquier commit que se vaya a sincronizar con Lovable.
- No exponer ni versionar secretos, credenciales, tokens o identificadores sensibles.
- No revertir cambios ajenos presentes en el arbol de trabajo.
- Mantener la navegacion consciente del scroll en `SiteHeader`.
- Mantener `overflow-x-clip` de la pagina; no encapsular el contenido en un contenedor con scroll que rompa el comportamiento del header sticky.
- Conservar las rutas, anclas y CTAs existentes salvo que se solicite expresamente un cambio funcional.
- No publicar, desplegar ni hacer push sin una instruccion explicita.
