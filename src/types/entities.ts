// Entidades futuras (backend). Mantener alineadas con las tablas planeadas:
// solicitudes, clientes, imagenes_solicitud, servicios, unidades, trabajos_realizados, analisis_ia
export type Solicitud = {
  id?: string;
  folio?: string;
  unidad?: string;
  servicio: string;
  /** Descripción libre cuando el trabajo es «Otro trabajo». */
  servicioDetalle?: string;
  ubicacion: string;
  // Detalle opcional del lugar (paso "Lugar" del cotizador).
  direccion?: string;
  referencias?: string;
  fecha: string;
  altura: string;
  personas: string;
  duracion: string;
  acceso: string;
  obstaculos: string;
  estabilizadores: "si" | "no" | "no-se" | "";
  observaciones: string;
  // Datos de contacto del cliente (paso "Contacto" del cotizador).
  nombre?: string;
  empresa?: string;
  telefono?: string;
  email?: string;
};
export type ImagenSolicitud = { id?: string; solicitudId?: string; file: File; previewUrl: string };
export type Cliente = { id?: string; nombre: string; telefono: string; email?: string };
export type Servicio = { id: string; nombre: string; descripcion?: string; foto?: string };
export type Unidad = { id: string; nombre: string; specs: { label: string; value: string }[] };
export type TrabajoRealizado = {
  id: string;
  foto?: string;
  tipo: string;
  zona: string;
  descripcion: string;
  altura?: string;
  tiempo?: string;
};
export type AnalisisIA = {
  solicitudId: string;
  resultado: "alta" | "revisar" | "humana";
  notas: string[];
};
