"""Genera public/assets/industrial/steel-tread-plate.webp.

Textura de placa diamantada (tread plate) en azul carbón, generada por procedimiento
(sin imágenes de terceros): mapa de alturas periódico con relieves alternados ±45°,
sombreado difuso + especular, sombra proyectada, oclusión y grano cepillado.
La loseta es continua en ambos ejes (todas las operaciones son periódicas).

Uso: python3 -I docs/tools/generate_tread_plate.py <salida.webp>
Requiere numpy y Pillow.
"""
import sys
import numpy as np
from PIL import Image

N = 512          # tamaño de la loseta en píxeles (se muestra a 256 px CSS → 2x en pantallas retina)
STEP = 64        # separación entre relieves
L, W = 25.0, 6.6 # semilongitud y semiancho de cada relieve
rng = np.random.default_rng(21)

yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)

def periodic_noise(scale, aniso=(1.0, 1.0)):
    """Ruido periódico filtrado en frecuencia (scale = tamaño típico de la mancha en px)."""
    f = np.fft.fftfreq(N)
    fy, fx = np.meshgrid(f, f, indexing="ij")
    r = np.sqrt((fx * aniso[0]) ** 2 + (fy * aniso[1]) ** 2)
    filt = np.exp(-(r * scale) ** 2)
    spec = np.fft.fft2(rng.standard_normal((N, N))) * filt
    out = np.real(np.fft.ifft2(spec))
    return (out - out.mean()) / (out.std() + 1e-9)

def blur_periodic(a, sigma):
    f = np.fft.fftfreq(N)
    fy, fx = np.meshgrid(f, f, indexing="ij")
    g = np.exp(-2 * (np.pi * sigma) ** 2 * (fx ** 2 + fy ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(a) * g))

# --- Mapa de alturas de los relieves ---------------------------------------------------
H = np.zeros((N, N), np.float32)
for j in range(N // STEP):
    for i in range(N // STEP):
        cx, cy = i * STEP + STEP / 2, j * STEP + STEP / 2
        ang = np.deg2rad(-45 if (i + j) % 2 == 0 else 45)
        jitter = rng.uniform(0.94, 1.04)
        # distancia periódica al centro
        dx = (xx - cx + N / 2) % N - N / 2
        dy = (yy - cy + N / 2) % N - N / 2
        u = dx * np.cos(ang) + dy * np.sin(ang)
        v = -dx * np.sin(ang) + dy * np.cos(ang)
        t = np.clip(1 - (u / (L * jitter)) ** 2, 0, 1)
        w = W * t ** 0.55 + 1e-3
        prof = np.clip(1 - (v / w) ** 2, 0, 1)
        h = np.sqrt(prof) * t ** 0.25
        H = np.maximum(H, h * jitter)

lug_mask = (H > 0.02).astype(np.float32)

# Relieve fino: abolladuras suaves y cepillado horizontal ligeramente inclinado
H_total = (
    H * 6.0
    + periodic_noise(40) * 0.05
    + periodic_noise(1.6, aniso=(0.12, 1.0)) * 0.035
)

# --- Normales y luz ---------------------------------------------------------------------
gx = (np.roll(H_total, -1, 1) - np.roll(H_total, 1, 1)) * 0.5
gy = (np.roll(H_total, -1, 0) - np.roll(H_total, 1, 0)) * 0.5
n = np.dstack([-gx, -gy, np.ones_like(gx)])
n /= np.linalg.norm(n, axis=2, keepdims=True)
light = np.array([-0.3, -0.82, 0.5]); light /= np.linalg.norm(light)
view = np.array([0.0, 0.0, 1.0])
half = light + view; half /= np.linalg.norm(half)
diff = np.clip(n @ light, 0, 1)
spec = np.clip(n @ half, 0, 1) ** 30

# Sombra proyectada de los relieves (hacia abajo a la derecha) y oclusión de contacto
shadow = blur_periodic(np.roll(np.roll(lug_mask, 4, 0), 3, 1), 2.6) * (1 - lug_mask)
ao = blur_periodic(lug_mask, 5.0) * (1 - lug_mask)

# --- Color --------------------------------------------------------------------------------
base = np.array([14, 24, 41], np.float32) / 255           # azul carbón
tint = periodic_noise(90)[..., None] * 0.035                # variación de tono amplia
albedo = base * (1 + tint)
col = albedo * (0.42 + 1.05 * diff[..., None])
col += spec[..., None] * np.array([160, 192, 230]) / 255 * 1.05
col *= (1 - 0.55 * shadow[..., None]) * (1 - 0.25 * ao[..., None])
grain = periodic_noise(0.7)[..., None] * 0.006
col = np.clip(col + grain, 0, 1)

out = sys.argv[1] if len(sys.argv) > 1 else "steel-tread-plate.webp"
Image.fromarray((col * 255).round().astype(np.uint8)).save(out, "WEBP", quality=82, method=6)
print("ok", out)
