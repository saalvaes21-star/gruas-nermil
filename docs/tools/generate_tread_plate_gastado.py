"""Genera public/assets/industrial/steel-tread-plate-gastado.webp.

Placa diamantada de acero estampado y algo gastado, según docs/mockup/hero-acero-aprobado.png:
relieves pequeños en forma de lente (punta afilada, cúpula redondeada), filas alternas «/» y «\\»,
biseles con luz desde arriba a la izquierda, sombra de contacto, superficie moteada y motas claras
de desgaste. Procedimiento propio (la fotografía del mockup no se usa como recurso) y continuo en
ambos ejes. Las texturas anteriores no se modifican.

Escala: la loseta mide 496 × 520 px y se muestra a 248 × 260 px CSS (2× en retina). Relieves de
≈32 × 11 px CSS visibles (puntas afiladas incluidas) repetidos cada 62 × 65 px CSS por orientación, con filas cada ≈32 px: la proporción
del mockup (lente 43 × 15, retícula 89 × 93 en su imagen de 2048 px) reducida a una portada de
≈1440 px.

Uso: python3 -I docs/tools/generate_tread_plate_gastado.py <salida.webp>
Requiere numpy y Pillow.
"""
import sys
import numpy as np
from PIL import Image

NX, NY = 496, 520            # 4 × 4 períodos
L, W = 44.0, 15.0            # semilongitud y semiancho del relieve (px de loseta)
BASE = np.array([9, 14, 22], np.float32) / 255   # azul carbón (antes de la luz CSS del Hero)
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


# --- Relieves: filas alternas «/» y «\\» desplazadas medio paso -------------------------------
# Retícula medida en el mockup por autocorrelación: el mismo relieve se repite cada 89 × 93 px de su
# imagen (≈62 × 65 px CSS en la portada), con la fila de orientación contraria a media altura.
PX, PY = NX / 4, NY / 4      # 124 × 130 px de loseta
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
        w = W * s * t + 1e-3                                  # lente: puntas afiladas
        dome = np.sqrt(np.clip(1 - (v / w) ** 2, 0, 1))       # cúpula redondeada
        H = np.maximum(H, dome ** 0.6 * t ** 0.15)            # cúpula aplanada: borde marcado

lug = (H > 0.02).astype(np.float32)
# superficie gastada: abolladuras amplias + picado fino
H_total = H * 10.0 + noise(45) * 0.16 + noise(3.0) * 0.06

# --- Luz desde arriba a la izquierda ---------------------------------------------------------
gx = (np.roll(H_total, -1, 1) - np.roll(H_total, 1, 1)) * 0.5
gy = (np.roll(H_total, -1, 0) - np.roll(H_total, 1, 0)) * 0.5
n = np.dstack([-gx, -gy, np.ones_like(gx)])
n /= np.linalg.norm(n, axis=2, keepdims=True)
light = np.array([-0.5, -0.6, 0.62]); light /= np.linalg.norm(light)
half = light + np.array([0.0, 0.0, 1.0]); half /= np.linalg.norm(half)
diff = np.clip(n @ light, 0, 1)
spec = np.clip(n @ half, 0, 1) ** 9

shadow = blur(np.roll(np.roll(lug, 3, 0), 3, 1), 1.8) * (1 - lug)
ao = blur(lug, 3.0) * (1 - lug)

# --- Color y desgaste ------------------------------------------------------------------------
mottle = noise(70)[..., None] * 0.10 + noise(10)[..., None] * 0.10 + noise(1.6)[..., None] * 0.16  # manchas y grano del metal
albedo = BASE * (1 + mottle) * (1 + 0.12 * lug[..., None])
col = albedo * (0.4 + 1.35 * diff[..., None])
col += (spec * (0.2 + 0.8 * lug))[..., None] * np.array([120, 145, 175]) / 255 * 0.28
col *= (1 - 0.68 * shadow[..., None]) * (1 - 0.4 * ao[..., None])

# motas claras de desgaste (más frecuentes en las crestas de los relieves)
fleck_field = noise(0.9)
flecks = np.clip((fleck_field - (1.9 - 1.1 * H)) * 1.3, 0, 1)
col += flecks[..., None] * np.array([110, 128, 150]) / 255 * 0.4
col = np.clip(col + noise(0.7)[..., None] * 0.008, 0, 1)

out = sys.argv[1] if len(sys.argv) > 1 else "steel-tread-plate-gastado.webp"
Image.fromarray((col * 255).round().astype(np.uint8)).save(out, "WEBP", quality=84, method=6)
print("ok", out, NX, "x", NY)
