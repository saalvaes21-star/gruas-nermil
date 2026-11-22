import { business } from "@/config/business";
import type { Solicitud, ImagenSolicitud } from "@/types/entities";

/** Genera folio local. Futuro: lo asigna el backend al guardar en `solicitudes`. */
export const makeFolio = () => "SOL-" + Date.now().toString(36).toUpperCase().slice(-6);

/** Mensaje estructurado para WhatsApp. */
export function buildWhatsAppMessage(s: Partial<Solicitud> & { fotos?: number }, folio?: string) {
  const lines = [
    "Hola, quiero cotizar la renta de una grúa con canastilla.",
    folio && `Solicitud: ${folio}`,
    s.nombre && `Nombre: ${s.nombre}`,
    s.empresa && `Empresa: ${s.empresa}`,
    s.telefono && `Teléfono / WhatsApp: ${s.telefono}`,
    s.email && `Correo: ${s.email}`,
    s.unidad && `Unidad de interés: ${s.unidad}`,
    s.servicio && `Trabajo: ${s.servicio}`,
    s.servicioDetalle && `Detalle del trabajo: ${s.servicioDetalle}`,
    s.ubicacion && `Ciudad o municipio: ${s.ubicacion}`,
    s.direccion && `Dirección o referencia: ${s.direccion}`,
    s.referencias && `Referencias del lugar: ${s.referencias}`,
    s.fecha && `Fecha estimada: ${s.fecha}`,
    s.altura && `Altura aprox.: ${s.altura}`,
    s.personas && `Personas: ${s.personas}`,
    s.duracion && `Duración: ${s.duracion}`,
    s.acceso && `Acceso de la unidad: ${s.acceso}`,
    s.obstaculos && `Obstáculos visibles: ${s.obstaculos}`,
    s.estabilizadores &&
      `Espacio para estabilizadores: ${{ si: "Sí", no: "No", "no-se": "No estoy seguro" }[s.estabilizadores]}`,
    s.observaciones &&
      `Condiciones de acceso / descripción: ${s.observaciones}`,
    s.fotos
      ? `Tengo ${s.fotos} fotografía(s) del lugar; las adjunto en este chat.`
      : null,
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
