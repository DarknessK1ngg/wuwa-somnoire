# Ambient bed for the site: 48 s seamless loop in D minor, built from earshot renders.
import numpy as np, soundfile as sf
from scipy.signal import fftconvolve, butter, sosfilt
P = '/home/claude/snd/parts/'
def load(n):
    y, sr = sf.read(P + n, always_2d=True)
    if y.shape[1] == 1: y = np.repeat(y, 2, axis=1)
    return y.astype(np.float64), sr
_, SR = load('drone.wav')
L, T = 48.0, 9.0
N, NT = int(L * SR), int((L + T) * SR)
dry = np.zeros((NT, 2)); wet = np.zeros((NT, 2))
rng = np.random.default_rng(7)

def fade(y, fi, fo):
    y = y.copy(); a = int(fi * SR); b = int(fo * SR)
    if a: y[:a] *= np.linspace(0, 1, a)[:, None] ** 2
    if b: y[-b:] *= np.linspace(1, 0, b)[:, None] ** 2
    return y
def put(buf, y, t, g=1.0, pan=0.0):
    i = int(t * SR); y = y[: max(0, NT - i)]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(y), 0] += y[:, 0] * g * l * 1.414
    buf[i:i + len(y), 1] += y[:, 1] * g * r * 1.414

drone, _ = load('drone.wav')
for t in (0, 16, 32, 48): put(dry, fade(drone, 3, 3.5), t, 0.42)
wind, _ = load('wind.wav')
for t in (0, 24, 48): put(dry, wind, t, 0.30)
chords = [('D4', 0), ('Bb3', 12), ('G3', 24), ('A3', 36)]
for n, t in chords:
    pad, _ = load(f'pad_air_{n}.wav')
    put(wet, fade(pad, 2.5, 3.5), t, 0.55); put(dry, fade(pad, 2.5, 3.5), t, 0.35)
glass, _ = load('pad_glass_Bb3.wav'); put(wet, fade(glass, 3, 4), 12, 0.16)
for n, t in (('D3', 0.2), ('A3', 24.2)):
    b, _ = load(f'bowl_{n}.wav'); put(wet, b, t, 0.22, -0.3 if n == 'D3' else 0.3)
notes = {0: ['D5', 'A5', 'E5', 'A4'], 12: ['F5', 'D5', 'C6', 'A4'], 24: ['G5', 'D5', 'A5', 'E5'], 36: ['E5', 'A4', 'G5', 'C6']}
for t0, ns in notes.items():
    times = np.sort(rng.uniform(1.0, 10.5, 3))
    for k, t in enumerate(times):
        nm = ns[rng.integers(len(ns))]
        y, _ = load(f'pno_{nm}.wav')
        put(wet, y, t0 + t, rng.uniform(0.12, 0.22), rng.uniform(-0.6, 0.6))
        put(dry, y, t0 + t, 0.06, 0)

# hall: long stereo decaying noise, darkened
ir_len = int(4.5 * SR); tt = np.arange(ir_len) / SR
sos = butter(2, 3500, 'low', fs=SR, output='sos')
ir = np.stack([sosfilt(sos, rng.standard_normal(ir_len)) * np.exp(-tt * 1.6) for _ in range(2)], 1)
ir /= np.abs(ir).sum(0).max() / 6
rev = np.stack([fftconvolve(wet[:, c], ir[:, c])[:NT] for c in range(2)], 1)
mix = dry + wet * 0.5 + rev * 0.9
out = mix[:N].copy(); out[: NT - N] += mix[N:NT]          # fold the tail onto the head: seamless loop
hp = butter(2, 28, 'high', fs=SR, output='sos'); out = sosfilt(hp, out, axis=0)
out *= 0.5 / np.abs(out).max()
sf.write('/home/claude/snd/ambient.wav', out.astype(np.float32), SR)
print('ok', SR, out.shape, round(float(np.sqrt((out**2).mean())), 4))
