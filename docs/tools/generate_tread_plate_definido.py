"""Genera public/assets/industrial/steel-tread-plate-gastado-definido.webp.

Versión derivada de steel-tread-plate-gastado.webp (generate_tread_plate_gastado.py), que se
conserva intacta. Misma loseta (496 × 520 px, mostrada a 248 × 260 px CSS), misma semilla y el
mismo orden de llamadas al generador aleatorio: forma, tamaño, orientación, densidad y posición de
los relieves son idénticas. Solo cambian el material y la luz:

- Base azul acero más luminosa (FLAT): tras la ganancia color-dodge del Hero (≈ ×1,55) la placa
  plana queda cerca de #263F56.
- Relieve 34 % más claro que la placa y bevel con más contraste (ambiente 0,12 + difusa 1,9,
  antes 0,4 + 1,35): cara iluminada más clara
  y cara opuesta más oscura.
- Sombra proyectada y oclusión de contacto algo más marcadas.
- Reflejo metálico discreto azul grisáceo en las aristas (sin blanco puro).
- Grano fino y motas de desgaste reducidos para que no compitan con los relieves.

Uso: python3 -I docs/tools/generate_tread_plate_definido.py <salida.webp>
Requiere numpy y Pillow.
"""
import sys
import numpy as np
from PIL import Image

NX, NY = 496, 520
L, W = 44.0, 15.0
FLAT = np.array([float(v) for v in (sys.argv[2] if len(sys.argv) > 2 else "13,28,42").split(",")], np.float32) / 255
K_AMB, K_DIFF = 0.12, 1.9
rng = np.random.default_rng(11)

yy, xx = np.mgrid[0:NY, 0:NX].astype(np.float32)


def noise(scale, aniso=(1.0, 1.0)):
    fy = np.fft.fftfreq(NY)[:, None]
    fx = np.fft.fftfreq(NX)[None, :]
    r = np.sqrt((fx * aniso[0]) ** 2 + (fy * aniso[1]) ** 2)
    out = np.real(np.fft.ifft2(np.fft.fft2(rng.standard_normal((NY, NX))) * np.exp(-(r * scale) ** 2)))
    return (out - out.mean()) / (out.std() + 1e-9)


def blur(a, sigma):
    fy = np.fft.fftfreq(NY)[:, None]
    fx = np.fft.fftfreq(NX)[None, :]
    return np.real(np.fft.ifft2(np.fft.fft2(a) * np.exp(-2 * (np.pi * sigma) ** 2 * (fx ** 2 + fy ** 2))))


# --- Relieves: idénticos a generate_tread_plate_gastado.py --------------------------------------
PX, PY = NX / 4, NY / 4
H = np.zeros((NY, NX), np.float32)
for j in range(8):
    deg = -42 if j % 2 == 0 else 42
    for i in range(4):
        cx = i * PX + (PX / 2 if j % 2 else 0.0) + PX / 4
        cy = j * PY / 2 + PY / 4
        ang = np.deg2rad(deg)
        dx = (xx - cx + NX / 2) % NX - NX / 2
        dy = (yy - cy + NY / 2) % NY - NY / 2
        u = dx * np.cos(ang) + dy * np.sin(ang)
        v = -dx * np.sin(ang) + dy * np.cos(ang)
        s = rng.uniform(0.95, 1.05)
        t = np.clip(1 - (u / (L * s)) ** 2, 0, 1)
        w = W * s * t + 1e-3
        dome = np.sqrt(np.clip(1 - (v / w) ** 2, 0, 1))
        H = np.maximum(H, dome ** 0.6 * t ** 0.15)

lug = (H > 0.02).astype(np.float32)
H_total = H * 10.0 + noise(45) * 0.16 + noise(3.0) * 0.06

# --- Luz desde arriba a la izquierda (misma dirección) -------------------------------------------
gx = (np.roll(H_total, -1, 1) - np.roll(H_total, 1, 1)) * 0.5
gy = (np.roll(H_total, -1, 0) - np.roll(H_total, 1, 0)) * 0.5
n = np.dstack([-gx, -gy, np.ones_like(gx)])
n /= np.linalg.norm(n, axis=2, keepdims=True)
light = np.array([-0.5, -0.6, 0.62]); light /= np.linalg.norm(light)
half = light + np.array([0.0, 0.0, 1.0]); half /= np.linalg.norm(half)
diff = np.clip(n @ light, 0, 1)
spec = np.clip(n @ half, 0, 1) ** 9
diff_flat = light[2]                                   # normal plana (0, 0, 1)

shadow = blur(np.roll(np.roll(lug, 3, 0), 3, 1), 1.8) * (1 - lug)
ao = blur(lug, 3.0) * (1 - lug)

# --- Material ----------------------------------------------------------------------------------
# Mismas llamadas a noise() y en el mismo orden que el original (la semilla da el mismo desgaste).
m_wide, m_mid, m_fine = noise(70), noise(10), noise(1.6)
mottle = (m_wide * 0.10 + m_mid * 0.06 + m_fine * 0.06)[..., None]
albedo = FLAT / (K_AMB + K_DIFF * diff_flat) * (1 + mottle) * (1 + 0.34 * lug[..., None])
col = albedo * (K_AMB + K_DIFF * diff[..., None])
col += (spec * (0.1 + 0.9 * lug))[..., None] * np.array([118, 140, 165]) / 255 * 0.3
col *= (1 - 0.85 * shadow[..., None]) * (1 - 0.55 * ao[..., None])

fleck_field = noise(0.9)
flecks = np.clip((fleck_field - (1.9 - 1.1 * H)) * 1.3, 0, 1)
col += flecks[..., None] * np.array([100, 120, 142]) / 255 * 0.2
col = np.clip(col + noise(0.7)[..., None] * 0.004, 0, 1)

out = sys.argv[1] if len(sys.argv) > 1 else "steel-tread-plate-gastado-definido.webp"
Image.fromarray((col * 255).round().astype(np.uint8)).save(out, "WEBP", quality=90, method=6)
print("ok", out, NX, "x", NY)
