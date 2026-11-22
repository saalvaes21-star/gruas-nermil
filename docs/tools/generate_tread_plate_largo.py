"""Genera public/assets/industrial/steel-tread-plate-largo-espaciado.webp.

Placa diamantada de relieves diagonales alargados, según docs/mockup/hero-acero-aprobado.png:
husos de punta afilada con arista central (faceta iluminada arriba, faceta en sombra abajo),
dispuestos en filas alternas «/» y «\\» desplazadas medio paso. Procedimiento propio (sin
imágenes de terceros) y continuo en ambos ejes. La textura anterior (steel-tread-plate.webp)
no se modifica.

La loseta mide 480 × 428 px y se muestra a 240 × 214 px CSS (2× en pantallas retina): relieves de
≈72 × 17 px CSS con un período de 120 × 107 px CSS por orientación (≈28 % menos relieves que la
versión anterior de 102 × 91 px, conservada como steel-tread-plate-largo.webp).

Uso: python3 -I docs/tools/generate_tread_plate_largo.py <salida.webp>
Requiere numpy y Pillow.
"""
import sys
import numpy as np
from PIL import Image

NX, NY = 480, 428             # loseta (2 períodos en cada eje)
PX, PY = NX / 2, NY / 2       # período por orientación
L, W = 72.0, 17.0             # semilongitud y semiancho de cada relieve (px de loseta)
rng = np.random.default_rng(7)

yy, xx = np.mgrid[0:NY, 0:NX].astype(np.float32)


def periodic_noise(scale, aniso=(1.0, 1.0)):
    fy = np.fft.fftfreq(NY)[:, None]
    fx = np.fft.fftfreq(NX)[None, :]
    r = np.sqrt((fx * aniso[0]) ** 2 + (fy * aniso[1]) ** 2)
    spec = np.fft.fft2(rng.standard_normal((NY, NX))) * np.exp(-(r * scale) ** 2)
    out = np.real(np.fft.ifft2(spec))
    return (out - out.mean()) / (out.std() + 1e-9)


def blur_periodic(a, sigma):
    fy = np.fft.fftfreq(NY)[:, None]
    fx = np.fft.fftfreq(NX)[None, :]
    g = np.exp(-2 * (np.pi * sigma) ** 2 * (fx ** 2 + fy ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(a) * g))


# --- Mapa de alturas: husos facetados ------------------------------------------------------
H = np.zeros((NY, NX), np.float32)
centers = []
for j in range(2):
    for i in range(2):
        centers.append((i * PX + PX * 0.25, j * PY + PY * 0.25, -45))        # «/»
        centers.append((i * PX + PX * 0.75, j * PY + PY * 0.75, 45))         # «\»
for cx, cy, deg in centers:
    ang = np.deg2rad(deg)
    dx = (xx - cx + NX / 2) % NX - NX / 2
    dy = (yy - cy + NY / 2) % NY - NY / 2
    u = dx * np.cos(ang) + dy * np.sin(ang)
    v = -dx * np.sin(ang) + dy * np.cos(ang)
    t = np.clip(1 - (u / L) ** 2, 0, 1)                 # perfil de huso: ancho máximo al centro
    w = W * t + 1e-3                            # lente: ancho máximo al centro, puntas afiladas
    roof = np.clip(1 - np.abs(v) / w, 0, 1)             # sección en V: arista central nítida
    h = roof * np.sqrt(t)                               # la arista baja hacia las puntas
    H = np.maximum(H, h)

lug = (H > 0.01).astype(np.float32)
H_total = H * 15.0 + periodic_noise(60) * 0.06 + periodic_noise(2.0, aniso=(0.15, 1.0)) * 0.03

# --- Normales y luz (cenital, como en la referencia: faceta superior iluminada) -------------
gx = (np.roll(H_total, -1, 1) - np.roll(H_total, 1, 1)) * 0.5
gy = (np.roll(H_total, -1, 0) - np.roll(H_total, 1, 0)) * 0.5
n = np.dstack([-gx, -gy, np.ones_like(gx)])
n /= np.linalg.norm(n, axis=2, keepdims=True)
light = np.array([-0.04, -0.82, 0.57]); light /= np.linalg.norm(light)
half = light + np.array([0.0, 0.0, 1.0]); half /= np.linalg.norm(half)
diff = np.clip(n @ light, 0, 1)
spec = np.clip(n @ half, 0, 1) ** 12

# Sombra proyectada abajo a la derecha y oclusión de contacto (los relieves no «flotan»)
shadow = blur_periodic(np.roll(np.roll(lug, 5, 0), 4, 1), 2.4) * (1 - lug)
ao = blur_periodic(lug, 4.0) * (1 - lug)

# --- Color ---------------------------------------------------------------------------------
base = np.array([10, 15, 20], np.float32) / 255                       # azul carbón (antes de la ganancia de luz CSS del Hero)
albedo = base * (1 + periodic_noise(110)[..., None] * 0.05)           # variación amplia de tono
# relieves pulidos: más claros y algo más neutros que la placa
albedo = albedo * (1 + 0.55 * lug[..., None]) + lug[..., None] * np.array([0.03, 0.03, 0.02])
col = albedo * (0.62 + 1.2 * diff[..., None])
# especular solo en los relieves pulidos (la placa plana queda mate)
col += (spec * lug)[..., None] * np.array([165, 188, 214]) / 255 * 1.15
col *= (1 - 0.42 * shadow[..., None]) * (1 - 0.3 * ao[..., None])
col = np.clip(col + periodic_noise(0.8)[..., None] * 0.006, 0, 1)

out = sys.argv[1] if len(sys.argv) > 1 else "steel-tread-plate-largo-espaciado.webp"
Image.fromarray((col * 255).round().astype(np.uint8)).save(out, "WEBP", quality=86, method=6)
print("ok", out, NX, "x", NY)
