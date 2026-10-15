// Datos del negocio. Reemplazar "Por confirmar" con información real.
// Fase futura: mover a la tabla `unidades` / configuración en backend.
export const PENDING = "Por confirmar";

export const business = {
  name: "Renta de Grúa CDMX",
  whatsapp: "", // Ej. "5215512345678" — vacío = por confirmar
  phone: PENDING,
  email: PENDING,
  hours: PENDING,
  coverage: ["CDMX", "Zona metropolitana"],
};

// Valores temporales de referencia mientras se confirma la unidad asignada; ver disclaimer en la sección Unidad.
export const unitSpecs = [
  { label: "Altura de trabajo", value: "14 m" },
  { label: "Alcance lateral", value: "9 m" },
  { label: "Capacidad de canastilla", value: "225 kg" },
  { label: "Número de personas", value: "2" },
  { label: "Tipo de brazo", value: "Telescópico" },
  { label: "Estabilizadores", value: "Hidráulicos" },
];

export const services = [
  "Instalación y mantenimiento de anuncios",
  "Luminarias",
  "Fachadas",
  "Cámaras y antenas",
  "Instalaciones eléctricas",
  "Mantenimiento comercial",
  "Mantenimiento industrial",
  "Otro trabajo en altura",
];

export const hotspots = [
  "Canastilla",
  "Brazo",
  "Estabilizadores",
  "Compartimentos",
  "Unidad / camión",
];
