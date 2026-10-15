import { business } from "@/config/business";
import type { Solicitud, ImagenSolicitud } from "@/types/entities";

/** Genera folio local. Futuro: lo asigna el backend al guardar en `solicitudes`. */
export const makeFolio = () => "SOL-" + Date.now().toString(36).toUpperCase().slice(-6);

/** Mensaje estructurado para WhatsApp. */
export function buildWhatsAppMessage(s: Partial<Solicitud> & { fotos?: number }, folio?: string) {
  const lines = [
    "Hola, quiero cotizar la grúa con canastilla.",
    folio && `Solicitud: ${folio}`,
    s.servicio && `Servicio: ${s.servicio}`,
    s.ubicacion && `Ubicación: ${s.ubicacion}`,
    s.fecha && `Fecha: ${s.fecha}`,
    s.altura && `Altura aprox.: ${s.altura}`,
    s.personas && `Personas: ${s.personas}`,
    s.duracion && `Duración: ${s.duracion}`,
    s.acceso && `Acceso de la unidad: ${s.acceso}`,
    s.obstaculos && `Obstáculos visibles: ${s.obstaculos}`,
    s.estabilizadores &&
      `Espacio para estabilizadores: ${{ si: "Sí", no: "No", "no-se": "No estoy seguro" }[s.estabilizadores]}`,
    s.fotos ? `Fotografías: ${s.fotos} (las envío en este chat)` : null,
    s.observaciones && `Observaciones: ${s.observaciones}`,
  ].filter(Boolean);
  return lines.join("\n");
}

/** Devuelve URL wa.me o null si el número aún no está configurado. */
export function whatsAppUrl(message: string) {
  if (!business.whatsapp) return null;
  return `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(message)}`;
}

/** Futuro: subir a Storage. Fase 1: no sube nada. */
export async function uploadSiteImages(_imgs: ImagenSolicitud[]) {
  return { uploaded: 0, pending: true };
}

/** Futuro: análisis IA de imágenes. Fase 1: no conectado. */
export async function requestAIPreanalysis(_id: string) {
  return null;
}
