/* eslint-disable */
// Originkit preset `custom-style` — props baked into the default export.
// Delivered by Originkit · stack: nextjs
"use client";

const RenderTarget = {
  current: () => "preview",
  hasRestrictions: () => false,
  canvas: "canvas",
  export: "export",
  preview: "preview",
  thumbnail: "thumbnail",
};

/*
 * PistachioFloret — a thick six-petal asterisk with a grooved pistachio face, a
 * white rim band over a navy seam and glossy lilac walls, floating on lavender.
 * Upload a logo and it is extruded in the same finish.
 *
 * Refined from the user's own `ShouldConvertSVG` component and matched to their
 * reference still (a green-faced 3D asterisk on #B297FE). Every control of that
 * component is kept under its original key; see the handover for moved defaults.
 *
 * Measured from the still (all in the logo's own units, 1 = the logo box):
 *   pose      yaw 17.5°, pitch 27.4°, petals turned −8°, a near-orthographic
 *             lens (fov ≈ 1°), half-thickness 0.173 (silhouette IoU 0.98)
 *   petals    round end r 0.094 on a 0.418 tip, straight tangent flanks
 *   body      back edge rounded r 0.077, walls bowed out 0.0085 at mid-depth;
 *             the face edge itself is sharp (the far edges show no rim)
 *   rim       a white band 0.03 down the wall, then a 0.012 navy seam
 *   grooves   54.6 per unit, parallel to a petal, sawtooth: quick rise over a
 *             quarter of the pitch, a steepening fall over the rest
 *   face      each petal washes toward the pale sheen by a clean cosine of its
 *             own direction — the face is very slightly domed, not flat
 *   walls     the same curve over facing angle on every petal: a camera-fixed
 *             studio seen in a glossy wall, down one lilac ramp, with a blue
 *             studio band, purple bounce in the gaps and black at the centre
 *
 * Rendering: one sphere-traced pass over the logo's screen box. The outline is a
 * baked distance texture (the asterisk is baked from exact maths on the CPU), so
 * a march step or an occlusion probe is one fetch. Edges are blended by coverage
 * from the ray's closest approach instead of supersampling.
 */

import { useEffect, useRef } from "react"
// ── moved controls (builder) ──
/**
 * Controls moved in the builder: into Advanced, out of it, or into groups of
 * their own. The code reads each one where it was first written, so the props
 * are put back in that shape before anything reads them.
 */
const MOVED_CONTROLS: { into: Record<string, string>; out: Record<string, string> } = {"into":{},"out":{"hover":"advanced","faceLight":"advanced"}}
const GROUP_FALLBACKS: Record<string, any> = {  }
function withMovedControls(props: any): any {
    const out = { ...props }
    for (const [k, g] of Object.entries(MOVED_CONTROLS.into)) out[k] = props?.[g]?.[k] ?? GROUP_FALLBACKS[g]?.[k]
    for (const [k, g] of Object.entries(MOVED_CONTROLS.out)) {
        if (out[k] !== undefined) out[g] = { ...(out[g] ?? {}), [k]: out[k] }
    }
    return out
}
// ── /moved controls ──

// ── types & defaults ─────────────────────────────────────────────────────────

type ImageSource = string | { src?: string; srcSet?: string; alt?: string }

export interface Placement {
    /** Turns the asterisk in the picture plane about its own centre, °; positive is clockwise. */
    angle: number
    /** Leans it about the frame's horizontal axis, °; positive tips its top away. */
    tilt: number
}

export interface Advanced {
    petals: number
    petalWidth: number
    bevel: number
    edgeLine: number
    dome: number
    grooveCount: number
    grooveAngle: number
    grooveDepth: number
    restYaw: number
    restPitch: number
    roll: number
    fov: number
    offsetX: number
    offsetY: number
    faceLight: string
    sheen: number
    bevelColor: string
    lineColor: string
    sideLight: string
    sideShadow: string
    crease: string
    bounce: string
    gloss: number
    specular: number
    ao: number
    grain: number
    vignette: number
    sway: number
    tiltSway: number
    bob: number
    loopMs: number
    hover: number
    tiltRange: number
    pressScale: number
}

export interface PistachioFloretProps {
    /** Your SVG or PNG logo; its shape is extruded in this finish. Empty shows the asterisk. */
    image?: ImageSource
    /** On paints the logo's face in Face; off keeps the logo's own colours. */
    tint?: boolean
    background?: string
    /** How big the logo draws, px at the 1200 × 800 reference frame. */
    size?: number
    /** Thickness of the extrusion, %. */
    depth?: number
    faceColor?: string
    sideColor?: string
    placement?: Partial<Placement>
    /** How far a drag turns the logo, %; 0 turns dragging off. */
    dragSens?: number
    /** Sway speed; 50 is the designed rate, 0 holds the pose. */
    speed?: number
    /** Turntable spin, °/s. */
    spin?: number
    advanced?: Partial<Advanced>
    style?: React.CSSProperties
}

const REF_W = 1200
const REF_H = 800
const REF_ASPECT = REF_W / REF_H

const DEFAULT_BACKGROUND = "#B297FE"
const DEFAULT_FACE = "#7ECB54"
const DEFAULT_SIDE = "#B9B1E6"
const DEFAULT_SIZE = 663
const DEFAULT_DEPTH = 50
const DEFAULT_DRAG = 50
const DEFAULT_SPEED = 50
const DEFAULT_SPIN = 0

const DEFAULT_PLACEMENT: Placement = { angle: 0, tilt: 0 }

const DEFAULT_ADVANCED: Advanced = {
    petals: 6,
    petalWidth: 19,
    bevel: 30,
    edgeLine: 12,
    dome: 4,
    grooveCount: 55,
    grooveAngle: 0,
    grooveDepth: 60,
    restYaw: 17.5,
    restPitch: 27.5,
    roll: -8,
    fov: 1,
    offsetX: 0,
    offsetY: 0,
    faceLight: "#C7EDBC",
    sheen: 85,
    bevelColor: "#FAFAFA",
    lineColor: "#2A1884",
    sideLight: "#FAFAFC",
    sideShadow: "#2C17AB",
    crease: "#04021E",
    bounce: "#6307B5",
    gloss: 24,
    specular: 70,
    ao: 60,
    grain: 0,
    vignette: 0,
    sway: 10,
    tiltSway: 5,
    bob: 10,
    loopMs: 6000,
    hover: 50,
    tiltRange: 15,
    pressScale: 96,
}

// Thickness of the extrusion at Depth 100 %, in logo units. The still's
// asterisk is 0.346 thick, which is Depth 50.
const DEPTH_FULL = 0.692
// Tip of the built-in petals from the centre, in logo units (measured on the still).
const PETAL_TIP = 0.418
// Rounding of the face's own edge. The still's far edges meet the background with
// no rim at all, so the edge is nearly sharp; the white rim is a band of wall.
const EDGE_ROUND = 0.0025
// The back edge is well rounded and the walls bow out slightly at mid-depth, both
// as shares of the thickness (the still: radius 0.077 and bow 0.0085 on 0.346).
// Fitting them took the silhouette IoU from 0.93 to 0.98.
const BACK_ROUND_K = 0.2227
const BULGE_K = 0.02455
// Groove phase against the logo centre, so the lines land where the still has them.
const GROOVE_PHASE = 0.3
// Logo mask resolution for uploaded images.
const MASK_N = 512
// Pointer lean follows in ~130 ms (critically damped); slower reads as lag.
const LEAN_OMEGA = 28
// Drag coast: velocity halves in ~0.23 s.
const COAST_DECAY = 3
// Pixel budget for the drawing buffer (CSS px² × scale²).
const PIXEL_BUDGET = 4.2e6

const DEG = Math.PI / 180

const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x)
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d)

// ── colour parsing (cached: the loop never re-parses an unchanged string) ────

const colourCache = new Map<string, [number, number, number]>()
function parseColor(input: unknown, fallback: string): [number, number, number] {
    const s = typeof input === "string" && input ? input : fallback
    const hit = colourCache.get(s)
    if (hit) return hit
    let out: [number, number, number] | null = null
    const hex = s.match(/#([0-9a-fA-F]{3,8})\b/)
    if (hex) {
        let h = hex[1]
        if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("")
        if (h.length >= 6) out = [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]
    }
    if (!out) {
        const rgb = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/)
        if (rgb) out = [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255]
    }
    if (!out) out = s === fallback ? [0, 0, 0] : parseColor(fallback, fallback)
    if (colourCache.size > 256) colourCache.clear()
    colourCache.set(s, out)
    return out
}

function imageSrc(image: ImageSource | undefined): string {
    if (!image) return ""
    if (typeof image === "string") return image
    return image.src || ""
}

// ── uploaded logo → signed distance field with its gradient ─────────────────

const imageCache = new Map<string, { img: HTMLImageElement; state: "loading" | "ok" | "failed" }>()

function dt1d(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array) {
    let k = 0
    v[0] = 0
    z[0] = -1e20
    z[1] = 1e20
    for (let q = 1; q < n; q++) {
        let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
        while (s <= z[k] && k > 0) {
            k--
            s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
        }
        if (s <= z[k]) {
            v[0] = q
            z[0] = -1e20
            z[1] = 1e20
            k = 0
            continue
        }
        k++
        v[k] = q
        z[k] = s
        z[k + 1] = 1e20
    }
    k = 0
    for (let q = 0; q < n; q++) {
        while (z[k + 1] < q) k++
        d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]
    }
}

function edt(grid: Float64Array, n: number) {
    const f = new Float64Array(n)
    const d = new Float64Array(n)
    const v = new Int32Array(n)
    const z = new Float64Array(n + 1)
    for (let x = 0; x < n; x++) {
        for (let y = 0; y < n; y++) f[y] = grid[y * n + x]
        dt1d(f, n, d, v, z)
        for (let y = 0; y < n; y++) grid[y * n + x] = d[y]
    }
    for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) f[x] = grid[y * n + x]
        dt1d(f, n, d, v, z)
        for (let x = 0; x < n; x++) grid[y * n + x] = d[x]
    }
}

function blur3(f: Float32Array, n: number, t: Float32Array) {
    for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++)
            t[y * n + x] = (f[y * n + Math.max(x - 1, 0)] + f[y * n + x] + f[y * n + Math.min(x + 1, n - 1)]) / 3
    for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++)
            f[y * n + x] = (t[Math.max(y - 1, 0) * n + x] + t[y * n + x] + t[Math.min(y + 1, n - 1) * n + x]) / 3
}

/**
 * Rasterises the logo into the mask canvas (kept as the face-colour texture) and
 * returns RGBA: signed distance in logo units, its unit gradient (x right, y up).
 * A fully opaque picture is keyed against its corner colour, as the original did.
 */
function logoField(ctx: CanvasRenderingContext2D, n: number, img: HTMLImageElement): Float32Array | null {
    ctx.clearRect(0, 0, n, n)
    const box = n * 0.84
    let iw = img.naturalWidth
    let ih = img.naturalHeight
    if (!iw || !ih) iw = ih = 1
    const s = box / Math.max(iw, ih)
    const rw = Math.max(1, Math.round(iw * s))
    const rh = Math.max(1, Math.round(ih * s))
    const rx = Math.round((n - rw) / 2)
    const ry = Math.round((n - rh) / 2)
    ctx.drawImage(img, rx, ry, rw, rh)
    const data = ctx.getImageData(0, 0, n, n).data
    let keyed = false
    let kr = 0
    let kg = 0
    let kb = 0
    let opaque = 0
    let total = 0
    for (let y = ry; y < ry + rh; y += 2)
        for (let x = rx; x < rx + rw; x += 2) {
            total++
            if (data[(y * n + x) * 4 + 3] > 250) opaque++
        }
    if (total && opaque / total > 0.97) {
        keyed = true
        const pts = [
            [rx + 1, ry + 1],
            [rx + rw - 2, ry + 1],
            [rx + 1, ry + rh - 2],
            [rx + rw - 2, ry + rh - 2],
        ]
        for (const [x, y] of pts) {
            const i = (y * n + x) * 4
            kr += data[i] / 4
            kg += data[i + 1] / 4
            kb += data[i + 2] / 4
        }
    }
    const inside = new Uint8Array(n * n)
    let count = 0
    for (let i = 0; i < n * n; i++) {
        let on = data[i * 4 + 3] > 127
        if (on && keyed) {
            const dr = data[i * 4] - kr
            const dg = data[i * 4 + 1] - kg
            const db = data[i * 4 + 2] - kb
            on = dr * dr + dg * dg + db * db > 64 * 64
        }
        if (on) {
            inside[i] = 1
            count++
        }
    }
    if (count < 20 || count > n * n * 0.9) return null
    const gOut = new Float64Array(n * n)
    const gIn = new Float64Array(n * n)
    for (let i = 0; i < n * n; i++) {
        gOut[i] = inside[i] ? 0 : 1e20
        gIn[i] = inside[i] ? 1e20 : 0
    }
    edt(gOut, n)
    edt(gIn, n)
    const f = new Float32Array(n * n)
    for (let i = 0; i < n * n; i++) f[i] = inside[i] ? -(Math.sqrt(gIn[i]) - 0.5) : Math.sqrt(gOut[i]) - 0.5
    const tmp = new Float32Array(n * n)
    blur3(f, n, tmp)
    blur3(f, n, tmp)
    const out = new Float32Array(n * n * 4)
    for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
            const i = y * n + x
            const gx = f[y * n + Math.min(x + 1, n - 1)] - f[y * n + Math.max(x - 1, 0)]
            // rows run down the mask, logo y runs up
            const gy = f[Math.max(y - 1, 0) * n + x] - f[Math.min(y + 1, n - 1) * n + x]
            const gl = Math.hypot(gx, gy) || 1
            out[i * 4] = f[i] / n
            out[i * 4 + 1] = gx / gl
            out[i * 4 + 2] = gy / gl
            out[i * 4 + 3] = 1
        }
    return out
}

// ── the still's studio, fitted (view space: x right, y up, z toward the camera) ──
// Face: a 4° dome reaching full tilt by r 0.262; it goes pale where it reflects
// a broad overhead light. Fitted per pixel to the still's paleness (rms 0.05).
const DOME_RAMP = 0.262
const SHEEN_DIR = [-0.033, 0.9455, 0.3239]
const SHEEN_EDGE = [0.8, 0.9206]
// Share of the live motion (sway, spin, drag, pointer lean) the wash follows.
const SHEEN_FOLLOW = 0.2
// Walls: brightness = base + a gradient + a soft top light, then the lilac ramp.
// The still's walls trace one curve over their facing angle on every petal.
const STUDIO_BASE = 1.2
const STUDIO_GRAD = [0.0204, 0.59, -0.807, 0.6529] // direction, weight
const STUDIO_TOP = [0.2406, 0.7296, -0.6393, 0.7226, 0.4837] // direction, weight, sharpness
// The dark band of the studio, reflected as saturated blue (σ ≈ 7°). It is a bar,
// not a spot: it crosses the still's walls at STUDIO_BAND along STUDIO_BAR_AXIS's
// great circle, so a doubly curved surface (the rounded back) shows a streak rather
// than a dot. A wall inside a gap reflects its neighbour instead, so the band fades
// with occlusion.
const STUDIO_BAND = [-0.2481, -0.7178, 0.6505]
const STUDIO_BAR_AXIS = [-0.918, 0.389, 0.079]
const BAND_WEIGHT = 1.0
const BAND_SHARP = 60
// Creases: walls facing across a gap tint toward Bounce, the ones facing down toward
// the blue band (split by this direction), then fall to Crease at the bottom.
const BOUNCE_SPLIT = [0.4744, -0.3918, 0.7883, 12.0]
const BOUNCE_LIGHT = 0.5
const CREASE = [1.35, 3.9794, 3.8343] // bounce rate, dark rate, dark power
// Occlusion probe weights at 0.01, 0.02, 0.04, 0.16 along the normal.
const AO_W = [2.0503, 1.1588, 0.5131, 0.2743]
// Walls darken a little just under the seam: depth, falloff (logo units).
const SEAM_SHADE = [0.15, 0.1]
// Ramp stop positions (crease → shade → mid → light), from the still's wall colours by luminance.
const RAMP_POS = [0.27, 0.72]

/**
 * The built-in asterisk as RGBA: signed distance in logo units and its unit gradient
 * (x right, y up), the same layout as an uploaded logo's field. Each petal is the
 * hull of the centre point and a disc, so its distance is exact; petals wide enough
 * to overlap take the union with their neighbour.
 */
function asteriskField(n: number, petals: number, rr: number, tip: number): Float32Array {
    const out = new Float32Array(n * n * 4)
    const L = tip - rr
    const sinB = Math.min(0.95, rr / L)
    const cosB = Math.sqrt(1 - sinB * sinB)
    const sector = (2 * Math.PI) / petals
    const overlap = Math.asin(sinB) > sector / 2 - 1e-3
    const cs = Math.cos(sector)
    const ss = Math.sin(sector)
    const sT = L * cosB
    const xT = L * cosB * cosB
    const half = petals >> 1
    const kc = new Float64Array(petals + 3)
    const ks = new Float64Array(petals + 3)
    for (let k = 0; k < petals + 3; k++) {
        kc[k] = Math.cos((k - 1 - half) * sector)
        ks[k] = Math.sin((k - 1 - half) * sector)
    }
    const r = [0, 0, 0]
    // one teardrop: apex at the origin, round end centred at (L, 0); py >= 0
    const tear = (px: number, py: number) => {
        const sc = Math.min(Math.max(px * cosB + py * sinB, 0), sT)
        const qx = px - cosB * sc
        const qy = py - sinB * sc
        const dl = Math.hypot(qx, qy)
        const cx = px - L
        const lc = Math.max(Math.hypot(cx, py), 1e-9)
        if (cx / lc >= -sinB && Math.abs(lc - rr) < dl) {
            r[0] = lc - rr
            r[1] = cx / lc
            r[2] = py / lc
            return
        }
        const inside = lc < rr || (-px * sinB + py * cosB < 0 && px > 0 && px < xT)
        const sg = inside ? -1 : 1
        r[0] = sg * dl
        r[1] = dl > 1e-9 ? (sg * qx) / dl : -sinB
        r[2] = dl > 1e-9 ? (sg * qy) / dl : cosB
    }
    for (let j = 0; j < n; j++) {
        const y = 0.5 - (j + 0.5) / n
        for (let i = 0; i < n; i++) {
            const x = (i + 0.5) / n - 0.5
            const k = Math.floor(Math.atan2(y, x) / sector + 0.5) + 1 + half
            const ca = kc[k]
            const sa = ks[k]
            const px = ca * x + sa * y
            const pyRaw = -sa * x + ca * y
            const py = Math.abs(pyRaw)
            tear(px, py)
            let d = r[0]
            let gx = r[1]
            let gy = r[2]
            if (overlap) {
                const nx = cs * px + ss * py
                const nyRaw = -ss * px + cs * py
                tear(nx, Math.abs(nyRaw))
                if (r[0] < d) {
                    const hx = r[1]
                    const hy = nyRaw < 0 ? -r[2] : r[2]
                    d = r[0]
                    gx = cs * hx - ss * hy
                    gy = ss * hx + cs * hy
                }
            }
            if (pyRaw < 0) gy = -gy
            const o = (j * n + i) * 4
            out[o] = d
            out[o + 1] = ca * gx - sa * gy
            out[o + 2] = sa * gx + ca * gy
            out[o + 3] = 1
        }
    }
    return out
}

// ── shaders ──────────────────────────────────────────────────────────────────

const VS = `#version 300 es
uniform vec4 uQuad;
void main() {
    int i = gl_VertexID;
    vec2 c = vec2((i == 1 || i == 2 || i == 4) ? 1.0 : 0.0, (i == 2 || i == 4 || i == 5) ? 1.0 : 0.0);
    gl_Position = vec4(mix(uQuad.xy, uQuad.zw, c), 0.0, 1.0);
}`

const FS = `#version 300 es
precision highp float;
precision highp int;

uniform vec2 uRes;
uniform vec2 uCenter;      // subject centre, buffer px from the bottom-left
uniform vec2 uRoll;        // cos/sin of Placement › Angle
uniform float uFocal;
uniform float uCamD;
uniform mat3 uRot;         // world → logo
uniform mat3 uRotRest;     // the same at the placed rest pose (no sway, spin, drag or lean)
uniform float uH;          // half-thickness
uniform float uR;          // corner rounding of the face edge
uniform float uRb;         // rounding of the back edge
uniform float uBulge;      // outward bow of the walls at mid-depth
uniform float uLip;        // white rim band, down the wall from the face
uniform float uLine;       // dark seam under the rim
uniform float uBound;      // logo half-extent in x/y
uniform sampler2D uSdf;    // outline distance (logo units) and its unit gradient
uniform sampler2D uArt;
uniform float uUseArt;

uniform vec3 uFace;
uniform vec3 uFaceLight;
uniform float uSheen;
uniform float uDome;       // tilt of the face normal toward the petal tips (tan)
uniform vec3 uGroove;      // frequency (per unit), angle (rad), depth
uniform vec3 uBevelCol;
uniform vec3 uLineCol;
uniform vec3 uRamp0;       // crease
uniform vec3 uRamp1;       // shade
uniform vec3 uRamp2;       // side mid-tone
uniform vec3 uRamp3;       // side light
uniform vec3 uDarkCol;     // the studio's blue band
uniform vec3 uBounce;      // purple bounce in the creases
uniform vec2 uStudio;      // blue-band strength, sharpness
uniform vec4 uAO;          // occlusion probe weights at 0.01, 0.02, 0.04, 0.16
uniform vec3 uBg;
uniform vec3 uPost;        // full-frame flag, grain, vignette
out vec4 outColor;

const float PI = 3.14159265;

// The outline: one fetch gives the distance and its gradient (baked on the CPU).
vec3 sd2(vec2 p) {
    vec2 uv = vec2(p.x + 0.5, 0.5 - p.y);
    vec2 c = clamp(uv, vec2(0.002), vec2(0.998));
    vec3 s = textureLod(uSdf, c, 0.0).rgb;
    vec2 o = uv - c;
    float lo = length(o);
    if (lo > 1e-5) return vec3(s.x + lo, normalize(vec2(o.x, -o.y)));
    return s;
}

// The walls bow out a little at mid-depth, and the back edge is well rounded.
float bowed(float d2, float z) {
    float u = z / uH;
    return d2 - uBulge * (1.0 - u * u);
}
float sdEx(float d2, float z) {
    float rr = z > 0.0 ? uR : uRb;
    vec2 w = vec2(bowed(d2, z) + rr, abs(z) - (uH - rr));
    return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - rr;
}
float map(vec3 p) { return sdEx(sd2(p.xy).x, p.z); }

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

// One groove, as measured on the still: a quick rise over the first quarter, then a
// fall that steepens into the next line, 1 - u^1.6. sawI is its running integral,
// so saw() can box-filter it over the pixel's footprint w (in groove periods).
const float SAW_RISE = 0.25;
const float SAW_POW = 1.6;
const float SAW_MEAN = 0.5 * SAW_RISE + (1.0 - SAW_RISE) * SAW_POW / (SAW_POW + 1.0);
float sawI(float x) {
    float f = fract(x);
    float n = floor(x);
    float a;
    if (f < SAW_RISE) a = 0.5 * f * f / SAW_RISE;
    else {
        float u = (f - SAW_RISE) / (1.0 - SAW_RISE);
        a = 0.5 * SAW_RISE + (1.0 - SAW_RISE) * (u - pow(u, SAW_POW + 1.0) / (SAW_POW + 1.0));
    }
    return n * SAW_MEAN + a;
}
float saw(float x, float w) {
    w = max(w, 1e-4);
    return (sawI(x + 0.5 * w) - sawI(x - 0.5 * w)) / w;
}

void main() {
    vec2 frag = gl_FragCoord.xy;
    vec2 q = frag - uCenter;
    q = vec2(uRoll.x * q.x - uRoll.y * q.y, uRoll.y * q.x + uRoll.x * q.y);
    vec3 ro = vec3(0.0, 0.0, uCamD);
    vec3 rd = normalize(vec3(q, -uFocal));
    vec3 oro = uRot * ro;
    vec3 ord = uRot * rd;
    vec4 acc = vec4(0.0);

    vec3 bmax = vec3(uBound, uBound, uH + 0.002);
    vec3 sgn = vec3(ord.x >= 0.0 ? 1.0 : -1.0, ord.y >= 0.0 ? 1.0 : -1.0, ord.z >= 0.0 ? 1.0 : -1.0);
    vec3 inv = 1.0 / (sgn * max(abs(ord), vec3(1e-6)));
    vec3 t0 = (-bmax - oro) * inv;
    vec3 t1 = (bmax - oro) * inv;
    vec3 tmn = min(t0, t1);
    vec3 tmx = max(t0, t1);
    float tn = max(max(tmn.x, tmn.y), tmn.z);
    float tf = min(min(tmx.x, tmx.y), tmx.z);

    if (tf > max(tn, 0.0)) {
        float pix = 1.0 / uFocal;
        float invXY = 1.0 / max(length(ord.xy), 1e-4);
        float t = max(tn, 0.0);
        float best = 1e9;
        float bestT = t;
        float minR = 1e9;
        float minT = t;
        float gR = 1e9;
        float gT = t;
        bool hit = false;
        for (int i = 0; i < 96; i++) {
            if (t > tf) break;
            vec3 p = oro + ord * t;
            float d2 = sd2(p.xy).x;
            float d = sdEx(d2, p.z);
            float fp = t * pix;
            if (d < 0.25 * fp) { hit = true; break; }
            float r = d / fp;
            if (r < best) { best = r; bestT = t; }
            // the ray passed within a pixel of a nearer surface and moved on: keep the
            // closest approach, so that edge can be blended in by its coverage
            if (r < minR) { minR = r; minT = t; }
            else if (minR < 1.2 && r > minR + 0.6) {
                if (minR < gR) { gR = minR; gT = minT; }
                minR = 1e9;
            }
            // a ray outside the outline cannot reach the logo before covering that gap sideways
            float side = d2 - uBulge;
            float st = side > 0.0 ? max(d, side * invXY * 0.9) : d;
            t += max(st * 0.95, fp * 0.4);
        }
        float tMain = hit ? t : bestT;
        float cMain = hit ? 1.0 : 1.0 - smoothstep(0.25, 1.2, best);
        float cEdge = hit ? 1.0 - smoothstep(0.25, 1.2, gR) : 0.0;
        // shade the surface the ray stopped at, then (edge pixels only) the one it grazed
        for (int k = 0; k < 2; k++) {
            if (k == 0 && cMain <= 0.0) break;
            if (k == 1 && cEdge <= 0.0) break;
            float tt = k == 0 ? tMain : gT;
            vec3 p = oro + ord * tt;
            vec3 dg = sd2(p.xy);
            float fp = max(tt * pix, 1e-6);
            vec2 g2 = normalize(dg.yz + vec2(1e-7, 0.0));
            float zs = p.z < 0.0 ? -1.0 : 1.0;
            float rr = zs > 0.0 ? uR : uRb;
            vec2 w = vec2(bowed(dg.x, p.z) + rr, abs(p.z) - (uH - rr));
            // exact normal through the bow: d/dz of the bowed outline
            vec2 F = (w.x > 0.0 && w.y > 0.0) ? w / length(w) : (w.x > w.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0));
            vec3 nO = normalize(F.x * vec3(g2, 2.0 * uBulge * p.z / (uH * uH)) + F.y * vec3(0.0, 0.0, zs));
            mat3 toW = transpose(uRot);
            vec3 nW = toW * nO;
            vec3 V = -rd;
            float facing = clamp(dot(nW, V), 0.0, 1.0);

            // occlusion: four probes along the normal, weighted as fitted to the still's creases
            float o1 = clamp(map(p + nO * 0.01) * 100.0, 0.0, 1.0);
            float o2 = clamp(map(p + nO * 0.02) * 50.0, 0.0, 1.0);
            float o4 = clamp(map(p + nO * 0.04) * 25.0, 0.0, 1.0);
            float o16 = clamp(map(p + nO * 0.16) * 6.25, 0.0, 1.0);
            float vis = clamp(1.0 - dot(uAO, vec4(1.0 - o1, 1.0 - o2, 1.0 - o4, 1.0 - o16)), 0.0, 1.0);

            // arc-length position across the rim: < 0 on the face, then rim, seam, wall
            float rimLen = 0.5 * PI * uR;
            float lipEnd = rimLen + max(uLip - uR, 0.0);
            float ell;
            if (w.x > 0.0 && w.y > 0.0) ell = uR * (0.5 * PI - atan(w.y, w.x));
            else if (w.y > w.x) ell = min(w.x, 0.0);
            else ell = rimLen - min(w.y, 0.0);
            float aa = fp * 0.75 / max(facing, 0.2);
            // the green cap, its white rim and the seam belong to the front only
            float front = zs > 0.0 ? 1.0 : 0.0;

            // ── face: a faintly domed cap reflecting a broad overhead light ──
            vec2 rad = p.xy;
            float rl = length(rad);
            vec3 nF = normalize(vec3(-uDome * smoothstep(0.0, ${DOME_RAMP.toFixed(3)}, rl) * rad / max(rl, 1e-5), 1.0));
            vec3 sDir = vec3(${SHEEN_DIR.map((v) => v.toFixed(4)).join(", ")});
            vec3 Rf = reflect(rd, toW * nF);
            vec3 Rr = reflect(rd, transpose(uRotRest) * nF);
            // the wash follows the placed pose fully and the live motion only partly, so a
            // sway sends a shimmer across the petals instead of flashing the whole face
            float sheen = uSheen * smoothstep(${SHEEN_EDGE[0].toFixed(4)}, ${SHEEN_EDGE[1].toFixed(4)}, mix(dot(Rr, sDir), dot(Rf, sDir), ${SHEEN_FOLLOW.toFixed(3)}));
            vec4 art = textureLod(uArt, clamp(vec2(p.x + 0.5, 0.5 - p.y), 0.0, 1.0), 0.0);
            vec3 base = mix(uFace, art.rgb, uUseArt * step(0.02, art.a));
            vec3 lit = uUseArt > 0.5 ? mix(base, vec3(1.0), 0.45) : uFaceLight;
            float ga = uGroove.y;
            float u = dot(p.xy, vec2(-sin(ga), cos(ga))) * uGroove.x - ${GROOVE_PHASE.toFixed(3)};
            float gw = uGroove.x * fp / max(facing, 0.25);
            float sw = saw(u, gw);
            float gvis = uGroove.z * (1.0 - smoothstep(0.3, 0.6, gw)) * (1.0 - 0.85 * sheen);
            vec3 face = base + (sw - SAW_MEAN) * 0.17 * gvis;
            // the still's wash bows toward green: green rises early, blue late
            face = mix(face, lit, clamp(vec3(sheen) + vec3(0.1, 1.3, -0.23) * sheen * (1.0 - sheen), 0.0, 1.0));

            // ── walls: the studio seen in a glossy wall, down one lilac ramp ──
            float dWall = max(uH - p.z - uLip - uLine, 0.0);
            float seam = 1.0 - ${SEAM_SHADE[0].toFixed(4)} * exp(-dWall / ${SEAM_SHADE[1].toFixed(4)});
            float sEnv = ${STUDIO_BASE.toFixed(4)} + ${STUDIO_GRAD[3].toFixed(4)} * dot(nW, vec3(${STUDIO_GRAD.slice(0, 3).map((v) => v.toFixed(4)).join(", ")}))
                + ${STUDIO_TOP[3].toFixed(4)} * exp(${STUDIO_TOP[4].toFixed(4)} * (dot(nW, vec3(${STUDIO_TOP.slice(0, 3).map((v) => v.toFixed(4)).join(", ")})) - 1.0));
            float sv = sEnv * vis * seam;
            vec3 side;
            if (sv < ${RAMP_POS[0].toFixed(3)}) side = mix(uRamp0, uRamp1, sv / ${RAMP_POS[0].toFixed(3)});
            else if (sv < ${RAMP_POS[1].toFixed(3)}) side = mix(uRamp1, uRamp2, (sv - ${RAMP_POS[0].toFixed(3)}) / ${(RAMP_POS[1] - RAMP_POS[0]).toFixed(3)});
            else side = mix(uRamp2, uRamp3, clamp((sv - ${RAMP_POS[1].toFixed(3)}) / ${(1 - RAMP_POS[1]).toFixed(3)}, 0.0, 1.0));
            // a narrow band of the studio (below the camera) reflects saturated blue
            float across = dot(nW, vec3(${STUDIO_BAR_AXIS.map((v) => v.toFixed(4)).join(", ")}));
    float td = clamp(uStudio.x * exp(-0.475 * uStudio.y * across * across + 3.0 * (dot(nW, vec3(${STUDIO_BAND.map((v) => v.toFixed(4)).join(", ")})) - 1.0)), 0.0, 1.0);
            side = mix(side, uDarkCol * seam, td * smoothstep(0.4, 0.95, vis));
            // creases: purple bounce on the walls that face across a gap, then black at the bottom
            float bm = clamp(0.5 + ${BOUNCE_SPLIT[3].toFixed(3)} * dot(nW, vec3(${BOUNCE_SPLIT.slice(0, 3).map((v) => v.toFixed(4)).join(", ")})), 0.0, 1.0);
            vec3 bc = mix(uBounce, mix(uDarkCol, uRamp2, ${BOUNCE_LIGHT.toFixed(3)}), bm);
            side = mix(side, bc, clamp(${CREASE[0].toFixed(4)} * (1.0 - vis), 0.0, 1.0));
            side = mix(side, uRamp0, clamp(${CREASE[1].toFixed(4)} * pow(1.0 - vis, ${CREASE[2].toFixed(4)}), 0.0, 1.0));

            // the rim is wall too: it sinks into shade where it dips into a crease
            vec3 bev = uBevelCol * mix(0.97, 1.0, facing) * mix(0.4, 1.0, smoothstep(0.0, 0.8, vis));

            vec3 c = side;
            c = mix(c, uLineCol * mix(0.7, 1.0, vis), front * smoothstep(lipEnd + uLine + aa, lipEnd + uLine - aa, ell));
            c = mix(c, bev, front * smoothstep(lipEnd + aa, lipEnd - aa, ell));
            // the rounded corner is the cap's own edge: green turning white across it
            vec3 corner = mix(face, bev, smoothstep(0.35, 1.0, ell / max(rimLen, 1e-5)));
            c = mix(c, corner, front * smoothstep(rimLen + aa, rimLen - aa, ell));
            c = mix(c, face, front * smoothstep(aa, -aa, ell));
            if (k == 0) acc = vec4(c * cMain, cMain);
            else acc = vec4(mix(acc.rgb, c, cEdge), 1.0);
        }
    }

    if (uPost.x > 0.5) {
        vec3 col = uBg * (1.0 - acc.a) + acc.rgb;
        vec2 uvc = frag / uRes - 0.5;
        uvc.x *= uRes.x / uRes.y;
        col *= 1.0 - uPost.z * 0.85 * smoothstep(0.35, 0.95, length(uvc));
        col += (hash(frag) - 0.5) * uPost.y * 0.22;
        outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    } else {
        outColor = vec4(clamp(acc.rgb, 0.0, 1.0), clamp(acc.a, 0.0, 1.0));
    }
}`

// ── GL helpers ───────────────────────────────────────────────────────────────

interface Prog {
    p: WebGLProgram
    loc: Map<string, WebGLUniformLocation | null>
    cache: Map<string, Float64Array>
}

function compile(gl: WebGL2RenderingContext, vs: string, fs: string): Prog | null {
    const sh = (type: number, src: string) => {
        const s = gl.createShader(type)
        if (!s) return null
        gl.shaderSource(s, src)
        gl.compileShader(s)
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) {
            console.warn("PistachioFloret shader:", gl.getShaderInfoLog(s))
            gl.deleteShader(s)
            return null
        }
        return s
    }
    const v = sh(gl.VERTEX_SHADER, vs)
    const f = sh(gl.FRAGMENT_SHADER, fs)
    if (!v || !f) return null
    const p = gl.createProgram()
    if (!p) return null
    gl.attachShader(p, v)
    gl.attachShader(p, f)
    gl.linkProgram(p)
    gl.deleteShader(v)
    gl.deleteShader(f)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) {
        console.warn("PistachioFloret link:", gl.getProgramInfoLog(p))
        return null
    }
    return { p, loc: new Map(), cache: new Map() }
}

// Uniform setters that upload only on change (doubles: a float32 cache never matches).
function uni(gl: WebGL2RenderingContext, pr: Prog) {
    const L = (n: string) => {
        let l = pr.loc.get(n)
        if (l === undefined) {
            l = gl.getUniformLocation(pr.p, n)
            pr.loc.set(n, l)
        }
        return l
    }
    const C = (n: string, k: number) => {
        let c = pr.cache.get(n)
        if (!c) {
            c = new Float64Array(k).fill(NaN)
            pr.cache.set(n, c)
        }
        return c
    }
    return {
        f1(n: string, a: number) {
            const c = C(n, 1)
            if (c[0] === a) return
            c[0] = a
            gl.uniform1f(L(n), a)
        },
        f2(n: string, a: number, b: number) {
            const c = C(n, 2)
            if (c[0] === a && c[1] === b) return
            c[0] = a
            c[1] = b
            gl.uniform2f(L(n), a, b)
        },
        f3(n: string, a: number, b: number, d: number) {
            const c = C(n, 3)
            if (c[0] === a && c[1] === b && c[2] === d) return
            c[0] = a
            c[1] = b
            c[2] = d
            gl.uniform3f(L(n), a, b, d)
        },
        f4(n: string, a: number, b: number, d: number, e: number) {
            const c = C(n, 4)
            if (c[0] === a && c[1] === b && c[2] === d && c[3] === e) return
            c[0] = a
            c[1] = b
            c[2] = d
            c[3] = e
            gl.uniform4f(L(n), a, b, d, e)
        },
        c3(n: string, v: [number, number, number]) {
            this.f3(n, v[0], v[1], v[2])
        },
        m3(n: string, m: Float64Array, up: Float32Array) {
            const c = C(n, 9)
            let same = true
            for (let i = 0; i < 9; i++)
                if (c[i] !== m[i]) {
                    same = false
                    c[i] = m[i]
                }
            if (same) return
            for (let i = 0; i < 9; i++) up[i] = m[i]
            gl.uniformMatrix3fv(L(n), false, up)
        },
        i1(n: string, a: number) {
            const c = C(n, 1)
            if (c[0] === a) return
            c[0] = a
            gl.uniform1i(L(n), a)
        },
    }
}

/**
 * Logo → world rotation, row-major into `out` (uploaded as is, GLSL reads the
 * transpose: world → logo). Order: roll in the logo's plane, pitch, yaw about
 * the vertical, then Tilt and the pointer/drag lean about the frame's horizontal.
 */
function poseInto(out: Float64Array, yaw: number, pitch: number, roll: number, lean: number) {
    const cy = Math.cos(yaw)
    const sy = Math.sin(yaw)
    const cp = Math.cos(-pitch)
    const sp = Math.sin(-pitch)
    const cr = Math.cos(roll)
    const sr = Math.sin(roll)
    const cl = Math.cos(-lean)
    const sl = Math.sin(-lean)
    // A = Ry · Rx(−pitch)
    const a00 = cy
    const a01 = sy * sp
    const a02 = sy * cp
    const a10 = 0
    const a11 = cp
    const a12 = -sp
    const a20 = -sy
    const a21 = cy * sp
    const a22 = cy * cp
    // B = A · Rz(roll)
    const b00 = a00 * cr + a01 * sr
    const b01 = -a00 * sr + a01 * cr
    const b10 = a10 * cr + a11 * sr
    const b11 = -a10 * sr + a11 * cr
    const b20 = a20 * cr + a21 * sr
    const b21 = -a20 * sr + a21 * cr
    // M = Rx(−lean) · B
    out[0] = b00
    out[1] = b01
    out[2] = a02
    out[3] = cl * b10 - sl * b20
    out[4] = cl * b11 - sl * b21
    out[5] = cl * a12 - sl * a22
    out[6] = sl * b10 + cl * b20
    out[7] = sl * b11 + cl * b21
    out[8] = sl * a12 + cl * a22
}

// ── component ────────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
function __OriginkitBase_PistachioFloret(props: PistachioFloretProps) {
    props = withMovedControls(props)
    const {
        image,
        tint = true,
        background = "#000000",
        size = 663,
        depth = 50,
        faceColor = "#7ECB54",
        sideColor = "#B9B1E6",
        placement,
        dragSens = 50,
        speed = 50,
        spin = 0,
        advanced,
        style,
    } = props

    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const grabRef = useRef<HTMLDivElement>(null)
    const live = {
        image,
        tint,
        background,
        size,
        depth,
        faceColor,
        sideColor,
        placement: { ...DEFAULT_PLACEMENT, ...placement },
        dragSens,
        speed,
        spin,
        adv: { ...DEFAULT_ADVANCED, ...advanced },
    }
    const propsRef = useRef(live)
    const prevRef = useRef(live)
    propsRef.current = live
    const wakeRef = useRef<() => void>(() => {})

    useEffect(() => {
        // Framer re-renders with equal values all the time: wake only on a real change
        const a = prevRef.current
        const b = live
        prevRef.current = b
        const same = (x: unknown, y: unknown): boolean => {
            if (x === y) return true
            if (typeof x !== "object" || typeof y !== "object" || !x || !y) return false
            const kx = Object.keys(x as object)
            const ky = Object.keys(y as object)
            if (kx.length !== ky.length) return false
            for (const k of kx) {
                const vx = (x as Record<string, unknown>)[k]
                const vy = (y as Record<string, unknown>)[k]
                if (vx === vy) continue
                if (typeof vx === "object" && typeof vy === "object" && same(vx, vy)) continue
                return false
            }
            return true
        }
        if (!same(a, b)) wakeRef.current()
    })

    useEffect(() => {
        const root = rootRef.current
        const canvas = canvasRef.current
        const grab = grabRef.current
        if (!root || !canvas) return

        // ── GL state ──
        let gl: WebGL2RenderingContext | null = null
        let lost = false
        let vao: WebGLVertexArrayObject | null = null
        let sdfTex: WebGLTexture | null = null
        let artTex: WebGLTexture | null = null
        let prog: Prog | null = null
        let uniforms: ReturnType<typeof uni> | null = null
        let shapeKey = ""
        let isLogo = false
        let artActive = false

        const mask = document.createElement("canvas")
        mask.width = mask.height = MASK_N
        const mctx = mask.getContext("2d", { willReadFrequently: true })

        const initGL = (): boolean => {
            const ctx = canvas.getContext("webgl2", {
                alpha: true,
                premultipliedAlpha: true,
                antialias: false,
                depth: false,
                stencil: false,
                powerPreference: "low-power",
                preserveDrawingBuffer: false,
            })
            if (!ctx) return false
            gl = ctx
            prog = compile(ctx, VS, FS)
            if (!prog) return false
            uniforms = uni(ctx, prog)
            vao = ctx.createVertexArray()
            const mk = () => {
                const t = ctx.createTexture()
                ctx.bindTexture(ctx.TEXTURE_2D, t)
                ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR)
                ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR)
                ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE)
                ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE)
                ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA8, 1, 1, 0, ctx.RGBA, ctx.UNSIGNED_BYTE, new Uint8Array(4))
                return t
            }
            sdfTex = mk()
            artTex = mk()
            shapeKey = ""
            isLogo = false
            artActive = false
            bufW = bufH = 0
            return true
        }
        const freeGL = () => {
            if (!gl || gl.isContextLost()) return
            if (prog) gl.deleteProgram(prog.p)
            prog = null
            if (sdfTex) gl.deleteTexture(sdfTex)
            if (artTex) gl.deleteTexture(artTex)
            if (vao) gl.deleteVertexArray(vao)
        }

        // ── sizing ──
        let cssW = 0
        let cssH = 0
        let shown = 1
        let quality = 1
        let bufW = 0
        let bufH = 0
        const rect = { left: 0, top: 0, width: 1, height: 1 }
        const measure = () => {
            const r = root.getBoundingClientRect()
            rect.left = r.left
            rect.top = r.top
            rect.width = r.width || 1
            rect.height = r.height || 1
            if (cssW > 0) {
                const s = r.width / cssW
                if (Math.abs(s - shown) / shown > 0.05) shown = s
            }
        }

        if (!initGL()) {
            // GPU path unavailable: the root's Background shows through
            canvas.style.display = "none"
            return
        }

        const ro = new ResizeObserver((entries) => {
            const e = entries[0]
            if (!e) return
            cssW = e.contentRect.width
            cssH = e.contentRect.height
            measure()
            wake()
        })
        ro.observe(root)

        let visible = true
        const io =
            typeof IntersectionObserver === "function"
                ? new IntersectionObserver((es) => {
                      for (const e of es) visible = e.isIntersecting
                      if (visible) wake()
                  })
                : null
        if (io) io.observe(root)
        const onVis = () => {
            if (!document.hidden) wake()
        }
        document.addEventListener("visibilitychange", onVis)

        const onLost = (e: Event) => {
            e.preventDefault()
            lost = true
            stop()
        }
        const onRestored = () => {
            lost = false
            if (initGL()) wake()
        }
        canvas.addEventListener("webglcontextlost", onLost)
        canvas.addEventListener("webglcontextrestored", onRestored)

        const mq = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null
        const reducedNow = () => {
            const rt = RenderTarget.current()
            return !!(mq && mq.matches) || rt === RenderTarget.thumbnail || rt === RenderTarget.export
        }

        // ── pointer: handlers only record; the rect is read once per frame after a move/scroll ──
        const pt = { cx: 0, cy: 0, inside: false, moved: false, down: false, id: -1, lastX: 0, lastY: 0, mouse: false }
        // drag turn (rad), with the last 80 ms of per-frame turns kept for the release flick
        const drag = { dx: 0, dy: 0, yaw: 0, pitch: 0, vYaw: 0, vPitch: 0 }
        const flick = new Float64Array(24) // [t, dyaw, dpitch] × 8
        let flickI = 0
        // springs: pointer lean (rad), press scale
        const sp = { yaw: 0, vyaw: 0, pitch: 0, vpitch: 0, sc: 1, vsc: 0 }
        let tx = 0
        let ty = 0

        const onMove = (e: PointerEvent) => {
            if (e.clientX === pt.cx && e.clientY === pt.cy && pt.inside && !pt.down) return
            if (pt.down && e.pointerId === pt.id) {
                if (pt.mouse && e.buttons === 0) {
                    release()
                } else {
                    drag.dx += e.clientX - pt.lastX
                    drag.dy += e.clientY - pt.lastY
                    pt.lastX = e.clientX
                    pt.lastY = e.clientY
                }
            }
            pt.cx = e.clientX
            pt.cy = e.clientY
            pt.inside = true
            pt.moved = true
            wake()
        }
        const onLeave = (e: PointerEvent) => {
            if (pt.down && e.pointerType !== "mouse") return
            pt.inside = false
            wake()
        }
        const preventDefault = (e: Event) => e.preventDefault()
        const onDown = (e: PointerEvent) => {
            if (e.button > 0) return
            onMove(e)
            if (num(propsRef.current.dragSens, DEFAULT_DRAG) <= 0) return
            if (e.pointerType === "mouse") e.preventDefault()
            pt.down = true
            pt.mouse = e.pointerType === "mouse"
            pt.id = e.pointerId
            pt.lastX = e.clientX
            pt.lastY = e.clientY
            drag.vYaw = drag.vPitch = 0
            flick.fill(0)
            try {
                root.setPointerCapture(e.pointerId)
            } catch {
                /* capture is a nicety */
            }
            root.style.cursor = "grabbing"
            window.addEventListener("dragstart", preventDefault)
            window.addEventListener("selectstart", preventDefault)
            wake()
        }
        const release = () => {
            if (!pt.down) return
            pt.down = false
            root.style.cursor = num(propsRef.current.dragSens, DEFAULT_DRAG) > 0 ? "grab" : "default"
            window.removeEventListener("dragstart", preventDefault)
            window.removeEventListener("selectstart", preventDefault)
            // release velocity: the turns of the last 80 ms
            const now = performance.now()
            let sy = 0
            let spch = 0
            for (let i = 0; i < 8; i++) {
                if (now - flick[i * 3] < 80) {
                    sy += flick[i * 3 + 1]
                    spch += flick[i * 3 + 2]
                }
            }
            if (!reducedNow()) {
                drag.vYaw = sy / 0.08
                drag.vPitch = spch / 0.08
            }
            wake()
        }
        const onUp = (e: PointerEvent) => {
            if (!pt.down || e.pointerId !== pt.id) return
            release()
            if (e.pointerType === "touch") pt.inside = false
        }
        const onScroll = () => {
            if (pt.inside) {
                pt.moved = true
                wake()
            }
        }
        root.addEventListener("pointermove", onMove)
        root.addEventListener("pointerenter", onMove)
        root.addEventListener("pointerleave", onLeave)
        root.addEventListener("pointerdown", onDown)
        root.addEventListener("pointerup", onUp)
        root.addEventListener("pointercancel", onUp)
        root.addEventListener("lostpointercapture", onUp)
        window.addEventListener("pointerup", onUp)
        window.addEventListener("scroll", onScroll, { passive: true, capture: true })

        // ── shape source ──
        const requestImage = (src: string) => {
            let entry = imageCache.get(src)
            if (!entry) {
                const img = new window.Image()
                img.crossOrigin = "anonymous"
                const e: { img: HTMLImageElement; state: "loading" | "ok" | "failed" } = { img, state: "loading" }
                imageCache.set(src, e)
                img.onload = () => {
                    e.state = "ok"
                    wake()
                }
                img.onerror = () => {
                    e.state = "failed"
                }
                img.src = src
                entry = e
            }
            return entry
        }
        const updateShape = () => {
            const g = gl
            if (!g) return
            const a = propsRef.current.adv
            const src = imageSrc(propsRef.current.image)
            const petals = clamp(Math.round(num(a.petals, DEFAULT_ADVANCED.petals)), 3, 12)
            const rr = clamp(num(a.petalWidth, DEFAULT_ADVANCED.petalWidth) / 200, 0.03, 0.2)
            let want = `builtin:${petals}:${rr}`
            let img: HTMLImageElement | null = null
            if (src) {
                const entry = requestImage(src)
                if (entry.state === "ok") {
                    want = "img:" + src
                    img = entry.img
                }
            }
            if (want === shapeKey) return
            shapeKey = want
            isLogo = false
            artActive = false
            let field: Float32Array | null = null
            if (img && mctx) {
                try {
                    field = logoField(mctx, MASK_N, img)
                } catch {
                    // tainted or unreadable picture: keep the asterisk
                    const entry = imageCache.get(src)
                    if (entry) entry.state = "failed"
                }
            }
            if (field) {
                g.activeTexture(g.TEXTURE1)
                g.bindTexture(g.TEXTURE_2D, artTex)
                g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, mask)
                isLogo = artActive = true
            } else {
                field = asteriskField(MASK_N, petals, rr, PETAL_TIP)
            }
            g.pixelStorei(g.UNPACK_ALIGNMENT, 1)
            g.activeTexture(g.TEXTURE0)
            g.bindTexture(g.TEXTURE_2D, sdfTex)
            g.texImage2D(g.TEXTURE_2D, 0, g.RGBA16F, MASK_N, MASK_N, 0, g.RGBA, g.FLOAT, field)
        }

        // ── motion state ──
        let phase = 0 // sway clock, s
        let spinA = 0
        let raf = 0
        let lastTick = -1
        let lastDraw = -1
        let dirty = true

        const animating = () => {
            if (reducedNow()) return false
            const p = propsRef.current
            const a = p.adv
            const swaying = num(p.speed, DEFAULT_SPEED) > 0 && (num(a.sway, 0) !== 0 || num(a.tiltSway, 0) !== 0 || num(a.bob, 0) !== 0)
            return swaying || num(p.spin, DEFAULT_SPIN) !== 0
        }
        const busy = () => {
            if (pt.down || Math.abs(drag.vYaw) > 1e-3 || Math.abs(drag.vPitch) > 1e-3) return true
            if (Math.abs(drag.pitch) > 1e-4 && !pt.down) return true
            if (Math.abs(sp.vyaw) > 1e-4 || Math.abs(sp.vpitch) > 1e-4 || Math.abs(sp.vsc) > 1e-4) return true
            if (Math.abs(sp.yaw - tx) > 1e-4 || Math.abs(sp.pitch - ty) > 1e-4) return true
            return false
        }

        const step = (dt: number) => {
            const p = propsRef.current
            const a = p.adv
            const reduced = reducedNow()

            if (pt.moved) {
                pt.moved = false
                measure()
            }
            const rate = reduced ? 0 : clamp(num(p.speed, DEFAULT_SPEED), 0, 100) / 50
            phase += dt * rate
            if (reduced) phase = 0
            if (!reduced) spinA = (spinA + dt * clamp(num(p.spin, DEFAULT_SPIN), -360, 360) * DEG) % (2 * Math.PI)

            // drag: 1:1 turns while held, a coast after release
            const sens = (clamp(num(p.dragSens, DEFAULT_DRAG), 0, 100) / 50) * 0.35 * DEG * (REF_H / Math.max(1, Math.min(cssH, cssW / REF_ASPECT)))
            if (pt.down) {
                const dYaw = drag.dx * sens
                // dragging down tips the face down (top toward the viewer)
                const dPitch = -drag.dy * sens
                drag.yaw += dYaw
                drag.pitch = clamp(drag.pitch + dPitch, -70 * DEG, 70 * DEG)
                const now = performance.now()
                flick[flickI * 3] = now
                flick[flickI * 3 + 1] = dYaw
                flick[flickI * 3 + 2] = dPitch
                flickI = (flickI + 1) % 8
            } else {
                // fixed 120 Hz substeps, so the coast is the same at any refresh rate
                let left = dt
                while (left > 1e-6) {
                    const h = Math.min(left, 1 / 120)
                    left -= h
                    drag.yaw += drag.vYaw * h
                    drag.pitch = clamp(drag.pitch + drag.vPitch * h, -70 * DEG, 70 * DEG)
                    const decay = Math.exp(-COAST_DECAY * h)
                    drag.vYaw *= decay
                    drag.vPitch *= decay
                    // the lean drifts home once the flick is spent
                    drag.pitch *= Math.exp(-2.2 * h)
                    if (Math.abs(drag.vYaw) < 0.02) drag.vYaw = 0
                    if (Math.abs(drag.vPitch) < 0.02) drag.vPitch = 0
                    if (Math.abs(drag.pitch) < 2e-4 && drag.vPitch === 0) drag.pitch = 0
                }
            }
            drag.yaw %= 2 * Math.PI
            drag.dx = drag.dy = 0

            // pointer lean toward the cursor, as a share of the frame
            const k = reduced ? 0 : Math.max(0, num(a.hover, DEFAULT_ADVANCED.hover)) / 50
            const range = num(a.tiltRange, DEFAULT_ADVANCED.tiltRange) * DEG * k
            if (pt.inside && !pt.down) {
                const u = (pt.cx - rect.left) / rect.width
                const v = (pt.cy - rect.top) / rect.height
                tx = clamp(u * 2 - 1, -1, 1) * range
                // the face turns toward the cursor: below the centre tips the top toward the viewer
                ty = -clamp(v * 2 - 1, -1, 1) * range
            } else {
                tx = 0
                ty = 0
            }
            const tSc = pt.down ? Math.max(0.6, 1 - (1 - num(a.pressScale, DEFAULT_ADVANCED.pressScale) / 100) * Math.max(k, 0.5)) : 1
            let left = dt
            while (left > 1e-6) {
                const h = Math.min(left, 1 / 240)
                left -= h
                const om = LEAN_OMEGA
                sp.vyaw += (om * om * (tx - sp.yaw) - 2 * om * sp.vyaw) * h
                sp.yaw += sp.vyaw * h
                sp.vpitch += (om * om * (ty - sp.pitch) - 2 * om * sp.vpitch) * h
                sp.pitch += sp.vpitch * h
                const os = 22
                sp.vsc += (os * os * (tSc - sp.sc) - 1.4 * os * sp.vsc) * h
                sp.sc += sp.vsc * h
            }
            if (Math.abs(tx - sp.yaw) < 1e-5 && Math.abs(sp.vyaw) < 1e-4) {
                sp.yaw = tx
                sp.vyaw = 0
            }
            if (Math.abs(ty - sp.pitch) < 1e-5 && Math.abs(sp.vpitch) < 1e-4) {
                sp.pitch = ty
                sp.vpitch = 0
            }
            if (Math.abs(tSc - sp.sc) < 1e-5 && Math.abs(sp.vsc) < 1e-4) {
                sp.sc = tSc
                sp.vsc = 0
            }
        }

        // ── draw ──
        const M = new Float64Array(9)
        const M32 = new Float32Array(9)
        const Mrest = new Float64Array(9)
        const grabKey = new Float64Array(4).fill(NaN)

        const draw = () => {
            const g = gl
            if (!g || lost || cssW < 1 || cssH < 1) return
            updateShape()
            const pr = prog
            const U = uniforms
            if (!pr || !U) return
            const p = propsRef.current
            const a = p.adv
            const pl = p.placement

            // buffer: never fewer pixels than the layout box; up to 2× when shown zoomed in
            const dpr = Math.min(2, window.devicePixelRatio || 1)
            let scl = dpr * clamp(shown, 1, 2)
            if (cssW * cssH * scl * scl > PIXEL_BUDGET) scl = Math.sqrt(PIXEL_BUDGET / (cssW * cssH))
            scl *= quality
            const wantW = Math.max(1, Math.round(cssW * scl))
            const wantH = Math.max(1, Math.round(cssH * scl))
            // resize right before painting, so a wiped buffer is never shown
            if (wantW !== bufW || wantH !== bufH) {
                bufW = canvas.width = wantW
                bufH = canvas.height = wantH
            }
            const bx = bufW / cssW

            // one frame → world map: S contains the 1200 × 800 composition
            const S = Math.min(cssH, cssW / REF_ASPECT)
            const Sb = S * bx
            const loop = Math.max(1, num(a.loopMs, DEFAULT_ADVANCED.loopMs) / 1000)
            const w1 = (2 * Math.PI * phase) / loop
            const w2 = 2 * w1
            const sizeB = Math.max(40, num(p.size, DEFAULT_SIZE)) * (S / REF_H) * bx * sp.sc
            const fov = clamp(num(a.fov, DEFAULT_ADVANCED.fov), 1, 70) * DEG
            const focal = Sb / 2 / Math.tan(fov / 2)
            const camD = focal / sizeB

            const yaw = (num(a.restYaw, 0) + num(a.sway, 0) * Math.sin(w1)) * DEG + sp.yaw + spinA + drag.yaw
            const pitch = (num(a.restPitch, 0) + num(a.tiltSway, 0) * Math.sin(w2)) * DEG
            const lean = num(pl.tilt, 0) * DEG + sp.pitch + drag.pitch
            poseInto(M, yaw, pitch, num(a.roll, 0) * DEG, lean)
            poseInto(Mrest, num(a.restYaw, 0) * DEG, num(a.restPitch, 0) * DEG, num(a.roll, 0) * DEG, num(pl.tilt, 0) * DEG)

            const ang = num(pl.angle, 0) * DEG
            const bobB = num(a.bob, 0) * (S / REF_H) * bx * Math.sin(w2)
            const cxB = bufW / 2 + (num(a.offsetX, 0) / 100) * bufW
            const cyB = bufH / 2 - (num(a.offsetY, 0) / 100) * bufH + bobB

            const thick = Math.max(0.002, (clamp(num(p.depth, DEFAULT_DEPTH), 0, 100) / 100) * DEPTH_FULL)
            const r = Math.min(EDGE_ROUND, thick / 2 - 0.0005)
            const h = Math.max(thick / 2, r + 0.0005)
            const lip = Math.max(0, num(a.bevel, DEFAULT_ADVANCED.bevel)) / 1000
            const bulge = thick * BULGE_K
            const rb = Math.min(thick * BACK_ROUND_K, h - 0.001)
            const bound = (isLogo ? 0.5 : PETAL_TIP + 0.004) + bulge

            // grab circle over the subject: touch can turn it on both axes there
            // (it ignores the bob, so the style is written only when the layout changes)
            if (grab) {
                const d = Math.round((sizeB / bx) * 0.86)
                const gx = Math.round(cxB / bx - d / 2)
                const gy = Math.round(cssH - (cyB - bobB) / bx - d / 2)
                const on = num(p.dragSens, DEFAULT_DRAG) > 0 ? 1 : 0
                if (grabKey[0] !== d || grabKey[1] !== gx || grabKey[2] !== gy || grabKey[3] !== on) {
                    grabKey[0] = d
                    grabKey[1] = gx
                    grabKey[2] = gy
                    grabKey[3] = on
                    grab.style.width = grab.style.height = `${d}px`
                    grab.style.transform = `translate(${gx}px, ${gy}px)`
                    grab.style.display = on ? "block" : "none"
                }
            }

            // screen box of the logo's bounding block, so only those pixels are shaded
            const post = num(a.grain, 0) > 0 || num(a.vignette, 0) > 0
            let x0 = 0
            let y0 = 0
            let x1 = bufW
            let y1 = bufH
            if (!post) {
                x0 = y0 = 1e9
                x1 = y1 = -1e9
                const ca = Math.cos(ang)
                const sa = Math.sin(ang)
                for (let i = 0; i < 8; i++) {
                    const ox = i & 1 ? bound : -bound
                    const oy = i & 2 ? bound : -bound
                    const oz = i & 4 ? h : -h
                    const wx = M[0] * ox + M[1] * oy + M[2] * oz
                    const wy = M[3] * ox + M[4] * oy + M[5] * oz
                    const wz = M[6] * ox + M[7] * oy + M[8] * oz
                    const dz = Math.max(camD - wz, 1e-3)
                    const qx = (focal * wx) / dz
                    const qy = (focal * wy) / dz
                    // screen = R(−angle)·q (clockwise for positive Angle)
                    const sx = cxB + ca * qx + sa * qy
                    const sy = cyB - sa * qx + ca * qy
                    if (sx < x0) x0 = sx
                    if (sx > x1) x1 = sx
                    if (sy < y0) y0 = sy
                    if (sy > y1) y1 = sy
                }
                const pad = 3
                x0 = clamp(Math.floor(x0 - pad), 0, bufW)
                y0 = clamp(Math.floor(y0 - pad), 0, bufH)
                x1 = clamp(Math.ceil(x1 + pad), 0, bufW)
                y1 = clamp(Math.ceil(y1 + pad), 0, bufH)
            }

            g.viewport(0, 0, bufW, bufH)
            g.clearColor(0, 0, 0, 0)
            g.clear(g.COLOR_BUFFER_BIT)
            if (x1 <= x0 || y1 <= y0) return
            g.useProgram(pr.p)
            g.bindVertexArray(vao)
            U.i1("uSdf", 0)
            U.i1("uArt", 1)
            g.activeTexture(g.TEXTURE0)
            g.bindTexture(g.TEXTURE_2D, sdfTex)
            g.activeTexture(g.TEXTURE1)
            g.bindTexture(g.TEXTURE_2D, artTex)

            U.f4("uQuad", (x0 / bufW) * 2 - 1, (y0 / bufH) * 2 - 1, (x1 / bufW) * 2 - 1, (y1 / bufH) * 2 - 1)
            U.f2("uRes", bufW, bufH)
            U.f2("uCenter", cxB, cyB)
            U.f2("uRoll", Math.cos(ang), Math.sin(ang))
            U.f1("uFocal", focal)
            U.f1("uCamD", camD)
            U.m3("uRot", M, M32)
            U.m3("uRotRest", Mrest, M32)
            U.f1("uH", h)
            U.f1("uR", r)
            U.f1("uRb", Math.max(rb, 0.0005))
            U.f1("uBulge", bulge)
            U.f1("uLip", lip)
            U.f1("uLine", Math.max(0, num(a.edgeLine, DEFAULT_ADVANCED.edgeLine)) / 1000)
            U.f1("uBound", bound)
            U.f1("uUseArt", artActive && !p.tint ? 1 : 0)

            U.c3("uFace", parseColor(p.faceColor, DEFAULT_FACE))
            U.c3("uFaceLight", parseColor(a.faceLight, DEFAULT_ADVANCED.faceLight))
            U.f1("uSheen", clamp(num(a.sheen, DEFAULT_ADVANCED.sheen), 0, 100) / 85)
            U.f1("uDome", Math.tan(clamp(num(a.dome, DEFAULT_ADVANCED.dome), 0, 30) * DEG))
            U.f3("uGroove", Math.max(0, num(a.grooveCount, DEFAULT_ADVANCED.grooveCount)), num(a.grooveAngle, 0) * DEG, num(a.grooveCount, 1) > 0 ? num(a.grooveDepth, DEFAULT_ADVANCED.grooveDepth) / 60 : 0)
            U.c3("uBevelCol", parseColor(a.bevelColor, DEFAULT_ADVANCED.bevelColor))
            U.c3("uLineCol", parseColor(a.lineColor, DEFAULT_ADVANCED.lineColor))
            const crease = parseColor(a.crease, DEFAULT_ADVANCED.crease)
            const shade = parseColor(a.sideShadow, DEFAULT_ADVANCED.sideShadow)
            const mid = parseColor(p.sideColor, DEFAULT_SIDE)
            U.c3("uRamp0", crease)
            // the ramp's shade stop sits between Crease and the blue band softened toward Sides
            U.f3(
                "uRamp1",
                crease[0] + (shade[0] + (mid[0] - shade[0]) * 0.28 - crease[0]) * 0.85,
                crease[1] + (shade[1] + (mid[1] - shade[1]) * 0.28 - crease[1]) * 0.85,
                crease[2] + (shade[2] + (mid[2] - shade[2]) * 0.28 - crease[2]) * 0.85
            )
            U.c3("uRamp2", mid)
            U.c3("uRamp3", parseColor(a.sideLight, DEFAULT_ADVANCED.sideLight))
            U.c3("uDarkCol", shade)
            U.c3("uBounce", parseColor(a.bounce, DEFAULT_ADVANCED.bounce))
            // Specular is the strength of the studio's blue band in the walls, Gloss its sharpness
            U.f2("uStudio", (BAND_WEIGHT * Math.max(0, num(a.specular, DEFAULT_ADVANCED.specular))) / 70, (BAND_SHARP * Math.max(2, num(a.gloss, DEFAULT_ADVANCED.gloss))) / 24)
            const aoK = Math.max(0, num(a.ao, DEFAULT_ADVANCED.ao)) / 60
            U.f4("uAO", AO_W[0] * aoK, AO_W[1] * aoK, AO_W[2] * aoK, AO_W[3] * aoK)
            U.c3("uBg", parseColor(p.background, DEFAULT_BACKGROUND))
            U.f3("uPost", post ? 1 : 0, num(a.grain, 0) / 100, num(a.vignette, 0) / 100)
            g.drawArrays(g.TRIANGLES, 0, 6)
        }

        // ── frame pacing: whole vsyncs at ~60 fps, a resolution ladder, rest when still ──
        const gaps = new Float64Array(15)
        const sortBuf = new Float64Array(15)
        let gapN = 0
        let gapI = 0
        let cadence = 16.67
        let divisor = 1
        const drawGaps = new Float64Array(9)
        let dgN = 0
        let dgI = 0
        let level = 0
        const LEVELS = [1, 0.85, 0.72, 0.6]
        let lateSince = -1
        let goodSince = -1
        const probe = { dir: 0, at: 0, before: 0 }
        let downBan = 0
        let upBan = 0
        let downRest = 30000
        let upRest = 30000
        let frames = 0

        const median = (src: Float64Array, n: number) => {
            for (let i = 0; i < n; i++) {
                const v = src[i]
                let j = i - 1
                while (j >= 0 && sortBuf[j] > v) {
                    sortBuf[j + 1] = sortBuf[j]
                    j--
                }
                sortBuf[j + 1] = v
            }
            return n ? sortBuf[n >> 1] : 0
        }

        const ladder = (now: number, gapMs: number) => {
            frames++
            if (frames < 30) return
            drawGaps[dgI] = gapMs
            dgI = (dgI + 1) % 9
            dgN = Math.min(9, dgN + 1)
            const gap = median(drawGaps, dgN)
            const target = clamp(divisor * cadence, 16, 33.4)
            if (probe.dir !== 0) {
                if (now - probe.at < 1500 || dgN < 9) return
                if (probe.dir < 0 && gap > probe.before * 0.87) {
                    // cheaper frames did not come faster (e.g. Framer's 30 Hz canvas): undo, rest longer each time
                    level--
                    downBan = now + downRest
                    downRest *= 2
                } else if (probe.dir > 0 && gap > probe.before * 1.13) {
                    level++
                    upBan = now + upRest
                    upRest *= 2
                }
                probe.dir = 0
                quality = LEVELS[level]
                return
            }
            const late = gap > 1.3 * target
            if (late && level < LEVELS.length - 1 && now > downBan) {
                if (lateSince < 0) lateSince = now
                if (now - lateSince > 600) {
                    level++
                    probe.dir = -1
                    probe.at = now
                    probe.before = gap
                    dgN = 0
                    lateSince = -1
                }
            } else lateSince = -1
            if (!late && gap < 1.1 * target && level > 0 && now > upBan) {
                if (goodSince < 0) goodSince = now
                if (now - goodSince > 4000) {
                    level--
                    probe.dir = 1
                    probe.at = now
                    probe.before = gap
                    dgN = 0
                    goodSince = -1
                }
            } else goodSince = -1
            quality = LEVELS[level]
        }

        const tick = (now: number) => {
            raf = 0
            if (lost || !visible || document.hidden) {
                lastTick = lastDraw = -1
                return
            }
            if (lastTick >= 0) {
                const gp = now - lastTick
                if (gp > 2 && gp < 120) {
                    gaps[gapI] = gp
                    gapI = (gapI + 1) % 15
                    gapN = Math.min(15, gapN + 1)
                }
            }
            lastTick = now
            if (gapN >= 3) cadence = median(gaps, gapN)
            const x = 16.667 / cadence
            if (x < divisor - 0.1 || x >= divisor + 1.1) divisor = Math.max(1, Math.floor(x + 0.1))
            const due = lastDraw < 0 || now - lastDraw >= (divisor - 0.5) * cadence
            const moving = animating() || busy()
            if (due && (moving || dirty)) {
                const dtMs = lastDraw < 0 ? 0 : now - lastDraw
                if (lastDraw >= 0 && moving) ladder(now, dtMs)
                lastDraw = now
                dirty = false
                step(Math.min(0.1, dtMs / 1000))
                draw()
            }
            if (animating() || busy() || dirty) raf = requestAnimationFrame(tick)
            else lastTick = lastDraw = -1
        }

        const wake = () => {
            dirty = true
            if (!raf && !lost && visible && !document.hidden) raf = requestAnimationFrame(tick)
        }
        const stop = () => {
            if (raf) cancelAnimationFrame(raf)
            raf = 0
            lastTick = lastDraw = -1
        }
        wakeRef.current = wake
        const onMotionPref = () => wake()
        if (mq && typeof mq.addEventListener === "function") mq.addEventListener("change", onMotionPref)
        wake()

        return () => {
            stop()
            wakeRef.current = () => {}
            ro.disconnect()
            if (io) io.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            canvas.removeEventListener("webglcontextlost", onLost)
            canvas.removeEventListener("webglcontextrestored", onRestored)
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerenter", onMove)
            root.removeEventListener("pointerleave", onLeave)
            root.removeEventListener("pointerdown", onDown)
            root.removeEventListener("pointerup", onUp)
            root.removeEventListener("pointercancel", onUp)
            root.removeEventListener("lostpointercapture", onUp)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("scroll", onScroll, { capture: true })
            window.removeEventListener("dragstart", preventDefault)
            window.removeEventListener("selectstart", preventDefault)
            if (mq && typeof mq.removeEventListener === "function") mq.removeEventListener("change", onMotionPref)
            freeGL()
        }
    }, [])

    const canDrag = dragSens > 0
    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                aspectRatio: `${REF_W} / ${REF_H}`,
                cursor: canDrag ? "grab" : "default",
                touchAction: canDrag ? "pan-y" : "auto",
                userSelect: "none",
                WebkitUserSelect: "none",
                ...style,
                overflow: "hidden",
                background,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
            />
            <div
                ref={grabRef}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: 0,
                    height: 0,
                    borderRadius: "50%",
                    touchAction: "none",
                    display: "none",
                }}
            />
        </div>
    )
}

// ── controls ─────────────────────────────────────────────────────────────────

// Control order arranged in the builder.

const __originkitPresetProps = {
  "background": "#08090c",
  "faceColor": "#00f0ff",
  "sideColor": "#1e293b",
  "faceLight": "#38bdf8",
  "image": {
    "alt": "XEROVA 3D Emblem",
    "src": "/xerova-icon.svg"
  },
  "tint": true,
  "size": 663,
  "depth": 50,
  "placement": {
    "tilt": 0,
    "angle": 0
  },
  "dragSens": 50,
  "speed": 50,
  "spin": 0,
  "hover": 50,
  "advanced": {
    "petals": 7,
    "petalWidth": 25,
    "bevel": 30,
    "edgeLine": 14,
    "dome": 4,
    "grooveCount": 55,
    "grooveAngle": 0,
    "grooveDepth": 60,
    "restYaw": 17.5,
    "restPitch": 27.5,
    "roll": -8,
    "fov": 1,
    "offsetX": 0,
    "offsetY": 0,
    "sheen": 85,
    "bevelColor": "#FAFAFA",
    "lineColor": "#4729DD",
    "sideLight": "#FAFAFC",
    "sideShadow": "#4A3898",
    "crease": "#04021E",
    "bounce": "#1F2B69",
    "gloss": 24,
    "specular": 70,
    "ao": 60,
    "grain": 0,
    "vignette": 0,
    "sway": 10,
    "tiltSway": 5,
    "bob": 10,
    "loopMs": 6000,
    "tiltRange": 15,
    "pressScale": 96
  }
};

export default function PistachioFloret(props: Record<string, unknown>) {
  return <__OriginkitBase_PistachioFloret {...(__originkitPresetProps as Record<string, unknown>)} {...props} />;
}
