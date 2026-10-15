# Contexto para Claude Code

## Objetivo

Continuar la landing de renta de grúa con canastilla desde el estado actual. No reconstruirla ni perder información, imágenes, interacciones o integraciones existentes.

## Reglas

- Inspecciona los archivos y `git status` antes de modificar.
- Conserva todos los cambios locales actuales; pertenecen al usuario.
- Antes de cambios amplios, crea un respaldo recuperable fuera del proyecto.
- No uses operaciones destructivas de Git.
- No inventes especificaciones, teléfonos, precios, cobertura o capacidades; conserva `Por confirmar` cuando corresponda.
- Mantén cualquier análisis con IA como preliminar y no vinculante.
- Conserva móvil, cotización, fotografías, vista 360, WebP e integración de Cloudflare AI.
- No hagas commit, push, compra de dominio ni cambios de DNS sin solicitud explícita.
- No afirmes que algo está publicado hasta comprobar el enlace público.

## Estado que debe conservarse

- Estética industrial moderna: negro/acero, azul técnico y amarillo de seguridad, sin saturación.
- Espaciado compacto y adaptable a móvil.
- Hero con la grúa más visible mediante `hero-industrial-overlay` y contraste suficiente para el texto izquierdo.
- El bloque amarillo inicial contiene un solo CTA: `Cotizar servicio`.
- El botón de WhatsApp fue retirado de ese bloque y no debe volver allí.
- Imágenes reales, unidad aislada para 360, flujo de cotización e integración de IA permanecen funcionando.

## Validación

Después de cambios ejecuta:

```bash
npm test
npm run build
git diff --check
```

El lint tiene problemas de formato preexistentes; separa cualquier regresión nueva del estado anterior.

## Publicación pendiente

- Worker: `saalvaes21-star-pixel-perfect-implementation`.
- URL: `https://saalvaes21-star-pixel-perfect-implementation.grua-renta-cdmx.workers.dev/`.
- Los últimos cambios pasaron pruebas y build antes del traspaso, pero aún deben publicarse y verificarse en producción.
- Configuración: `wrangler.jsonc`; salida: `.output`.
- Para evitar el problema del callback local usa `wrangler login --device` con los permisos mínimos de Workers.
- Tras publicar comprueba: `Cotizar servicio`, ausencia de `Cotizar mi servicio`, ausencia del botón WhatsApp en el bloque amarillo, carga desde arriba y hero menos oscuro.

## Archivos clave

- `src/routes/index.tsx`
- `src/styles.css`
- `src/components/site/QuoteWizard.tsx`
- `src/server.ts`
- `src/config/referenceImages.ts`
- `wrangler.jsonc`
