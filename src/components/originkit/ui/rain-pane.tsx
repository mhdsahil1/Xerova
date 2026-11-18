/* eslint-disable */
// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client"

/**
 * RainPane: a night window seen through real water.
 *
 * Built after a black-and-white photograph of drops on glass. Nothing of the
 * photo ships with it: its blurred backdrop is a handful of Gaussians, and every
 * drop is simulated and then refracted, so the look comes from the same optics
 * the photo recorded.
 *
 * Water:   drops are particles with a real volume, in millimetres, on a patch of
 *          glass MM_PER_H tall. A drop holds or runs by the Furmidge balance:
 *          gravity ρ·V·g against the contact line's pinning 2·r·σ·Δcos(θ).
 *          Weight grows with r³ and pinning with r, which is why a drop is still
 *          until it is suddenly too heavy. Running drops pay for it in viscous
 *          drag, swallow what they touch, meander over a pinning landscape and
 *          lay a rivulet that later breaks into a line of beads.
 * Pointer: a moving wettable spot. It pulls with a contact-line force, which
 *          scales with r like the pinning it beats, so even the smallest drop
 *          follows. What it gathers merges into one drop, and when that drop is
 *          past Capacity the contact line lets go and gravity takes it.
 * Glass:   each drop writes a cap into a height field. Sums of squared parabolas
 *          have a smooth union, so two drops neck into each other instead of
 *          overlapping. The final pass refracts every pixel through that surface
 *          by Snell's law into the backdrop, which is why each drop holds an
 *          upside-down picture of the street: dark at the top, the bright sky
 *          as a crescent at the bottom, black where the ray can no longer leave
 *          the water.
 * Cost:    the field and the picture are kept in textures and only the tiles
 *          something moved through are repainted. A settled pane draws nothing.
 */
import { useEffect, useRef } from "react"
import type { CSSProperties } from "react"

/* ---------------------------------------------------------------- */
/*  Reference frame and scene                                        */
/* ---------------------------------------------------------------- */

const REF_W = 1179
const REF_H = 1695
const REF_ASPECT = REF_W / REF_H

/** Height of the pane the reference frame shows. Its largest drops are then right at the size real drops let go. */
const MM_PER_H = 120
const MM_PER_REF_PX = MM_PER_H / REF_H

/** Size of one sown block of glass. Sown by index, so a resized frame finds the same drops where it left them. */
const TILE_MM = 14
const MAX_DROPS = 14000
const MAX_NODES = 12000
/** Screen tile for dirty tracking, in buffer px. */
const DIRTY_TILE = 48
const MAX_RECTS = 28
const PRIM_FLOATS = 12
const DATA_W = 1536
const DATA_H = 256
const MAX_PRIMS = Math.floor((DATA_W * DATA_H) / 3)
const ENV_SIZE = 512
/** The backdrop texture spans ±ENV_RANGE contain-units around the frame centre. */
const ENV_RANGE = 3
const NOISE_SIZE = 256

const PIXEL_BUDGET = 4.2e6
const LADDER = [1, 0.85, 0.72, 0.6]
const SUBSTEP = 1 / 120
const MAX_SUBSTEPS = 6

/* Water. SI values, expressed in mm, mN and s. */
const SIGMA = 0.072
const RHO_G = 9.81e-3
const STOP_SPEED = 1.5
const MAX_SPEED = 900
/** A parabola meets the glass at 2·tan(θ/2). This keeps its rim just short of total internal reflection, as the photo's lower edges are. */
const LENS_SLOPE = 0.88
/** Fraction of the static pin that survives once the contact line is moving. */
const KINETIC_PIN = 0.6

/**
 * Backdrop: the photo's out-of-focus street as anisotropic Gaussians over the
 * ground (x, y, σx, σy, turn, tone), fitted to a median-filtered copy to 2.4/255
 * rms. y runs down the frame. The last group sits past the reference frame, so
 * a wider or taller frame gets more of the street, not a dark band.
 */
const GLOW: number[][] = [
    [0.237, -0.029, 0.167, 0.149, 0.341, 0.425],
    [0.333, -0.387, 0.095, 0.207, 0.306, 0.099],
    [-0.292, -0.299, 0.093, 0.071, -0.328, 0.06],
    [0.306, -0.287, 0.145, 0.085, -0.043, 0.217],
    [-0.257, 0.278, 0.146, 0.058, -0.021, 0.093],
    [0.137, 0.171, 0.093, 0.085, -1.587, 0.181],
    [0.333, 0.289, 0.097, 0.241, -0.197, 0.067],
    [-0.304, -0.328, 0.192, 0.156, -1.406, 0.038],
    [0.018, -0.165, 0.083, 0.233, -0.052, 0.12],
    [1.05, 0.05, 0.26, 0.24, 0.2, 0.26],
    [-0.74, -0.08, 0.2, 0.34, -0.1, 0.3],
    [1.85, -0.15, 0.3, 0.28, 0, 0.2],
    [-1.75, 0.15, 0.3, 0.26, 0, 0.17],
    [0.12, -0.92, 0.36, 0.12, 0, 0.13],
    [-0.15, 0.95, 0.36, 0.12, 0, 0.1],
]

/**
 * The composition's largest drops, read off the reference: x, y, half width,
 * tail length (all in reference px) and the tail's lean from straight up.
 * Everything smaller is sown.
 */
const ANCHORS: number[][] = [
    [437, 868, 33, 26, 0.04],
    [733, 858, 46, 6, 0.2],
    [610, 336, 25, 36, 0.1],
    [298, 565, 13, 30, -0.05],
    [326, 563, 15, 28, 0.12],
    [553, 693, 26, 22, 0.5],
    [577, 703, 17, 24, -0.4],
    [578, 738, 6, 34, 3.1],
    [975, 22, 22, 30, 0.4],
    [20, 55, 19, 12, 0],
    [235, 15, 15, 10, 0.2],
    [1027, 345, 21, 42, 0.6],
    [917, 305, 20, 60, 0.42],
    [812, 318, 16, 46, 0.02],
    [715, 290, 17, 50, -0.1],
    [812, 515, 13, 92, 0.02],
    [812, 588, 16, 24, -0.1],
    [1127, 445, 17, 30, 0.1],
    [1150, 235, 12, 36, 0.05],
    [1075, 240, 10, 24, 0.1],
    [1060, 92, 16, 56, 0.25],
    [1110, 117, 10, 16, 0],
    [1140, 150, 7, 22, 0],
    [1077, 186, 13, 12, 0],
    [732, 425, 30, 30, 0.7],
    [485, 345, 10, 52, 0.15],
    [492, 442, 8, 62, 0.2],
    [590, 172, 19, 24, 0.2],
    [695, 165, 12, 20, 0.1],
    [1130, 516, 15, 10, 0],
    [1005, 578, 13, 62, 0.08],
    [1095, 1168, 14, 72, 0.05],
    [1148, 1092, 10, 60, 0],
    [1108, 987, 14, 72, 0.1],
    [630, 988, 14, 66, 0.04],
    [682, 972, 18, 30, 0.2],
    [552, 1002, 15, 30, 0.3],
    [252, 968, 21, 26, 0.25],
    [205, 960, 13, 18, 0.2],
    [300, 866, 22, 8, 0],
    [20, 887, 20, 30, 0.1],
    [38, 748, 14, 10, 0],
    [62, 815, 13, 10, 0],
    [205, 1175, 18, 62, 0.25],
    [345, 1242, 11, 42, 0.1],
    [210, 1268, 28, 6, 0],
    [336, 1062, 16, 42, 0.5],
    [468, 1002, 9, 30, 0.1],
    [765, 1308, 22, 46, 0.25],
    [688, 1264, 18, 46, 0.1],
    [810, 1170, 16, 14, 0.2],
    [1002, 1224, 20, 18, 0.2],
    [945, 1408, 22, 30, 0.3],
    [1130, 1442, 17, 16, 0],
    [660, 1192, 14, 8, 0],
    [758, 1197, 15, 12, 0.2],
    [797, 1152, 10, 26, 0.1],
    [738, 1112, 22, 18, 1.2],
    [240, 1462, 20, 14, 0],
    [755, 1664, 22, 8, 0],
    [1053, 1548, 16, 22, 0.1],
    [848, 1482, 13, 38, 0.05],
    [805, 1432, 16, 18, 0.1],
    [700, 1430, 12, 24, 0],
    [1041, 870, 16, 22, 0.3],
    [955, 1195, 12, 40, 0.1],
    [876, 722, 15, 6, 0],
    [875, 655, 12, 4, 0],
    [716, 636, 17, 12, 0.2],
    [763, 760, 17, 24, 0.4],
    [832, 750, 8, 28, 0],
    [550, 795, 16, 12, 0],
    [523, 602, 14, 8, 0],
]

/** Rivulets already on the glass: x, y, half width in reference px, top to bottom. */
const RIVULETS: number[][][] = [
    [
        [398, -30, 5],
        [392, 60, 7],
        [404, 130, 7],
        [418, 200, 8],
        [414, 240, 10],
        [405, 285, 16],
        [392, 345, 22],
        [400, 400, 19],
        [420, 440, 16],
        [432, 480, 17],
        [432, 540, 18],
        [426, 600, 21],
        [431, 660, 23],
        [429, 720, 25],
        [432, 780, 27],
        [436, 846, 30],
    ],
    [
        [72, 90, 6],
        [85, 150, 7],
        [88, 210, 6],
        [60, 255, 8],
        [98, 310, 9],
        [85, 380, 7],
        [65, 440, 12],
        [105, 520, 9],
        [110, 600, 8],
        [120, 640, 5],
    ],
    [
        [150, 1120, 6],
        [125, 1200, 5],
        [100, 1300, 5],
        [80, 1400, 4],
        [72, 1460, 3],
    ],
    [
        [930, 1158, 3],
        [948, 1230, 2.5],
        [965, 1300, 3],
        [980, 1346, 2],
    ],
]

/* ---------------------------------------------------------------- */
/*  Shaders                                                          */
/* ---------------------------------------------------------------- */

const GLSL_HEAD = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
`

const QUAD_VS = `${GLSL_HEAD}
void main(){
    vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const ENV_FS = `${GLSL_HEAD}
out vec4 o;
void main(){
    vec2 b = (gl_FragCoord.xy / ${ENV_SIZE.toFixed(1)} - 0.5) * ${(ENV_RANGE * 2).toFixed(1)};
    vec2 p = vec2(b.x, -b.y);
    float t = 0.0;
    ${GLOW.map((g) => {
        const c = Math.cos(g[4]).toFixed(5)
        const s = Math.sin(g[4]).toFixed(5)
        return `{ vec2 d = p - vec2(${g[0].toFixed(4)}, ${g[1].toFixed(4)});
        vec2 q = vec2((d.x * ${c} + d.y * ${s}) / ${g[2].toFixed(4)}, (d.y * ${c} - d.x * ${s}) / ${g[3].toFixed(4)});
        t += ${g[5].toFixed(4)} * exp(-0.5 * dot(q, q)); }`
    }).join("\n    ")}
    // the photo's blacks are true blacks: the fit's long tails must not lift them
    o = vec4(max(t * 1.08 - 0.012, 0.0), 0.0, 0.0, 1.0);
}`

/**
 * One cap of water. R gathers drops by addition, so two drops close to touching
 * reach the threshold between them first and neck like water. A gathers the
 * segments of a rivulet by MAX, so its joints do not double up.
 */
const PRIM_VS = `${GLSL_HEAD}
uniform sampler2D uData;
uniform mat3 uM;
uniform vec2 uView;
flat out vec4 vA;
flat out vec4 vB;
flat out vec4 vC;
out vec2 vW;
void main(){
    int id = gl_VertexID / 6;
    int c = gl_VertexID - id * 6;
    int ix = id * 3;
    ivec2 tc = ivec2(ix % ${DATA_W}, ix / ${DATA_W});
    vA = texelFetch(uData, tc, 0);
    vB = texelFetch(uData, tc + ivec2(1, 0), 0);
    vC = texelFetch(uData, tc + ivec2(2, 0), 0);
    vec2 lo = min(vA.xy, vA.zw) - vC.z;
    vec2 hi = max(vA.xy, vA.zw) + vC.z;
    vec2 f = vec2((c == 1 || c == 4 || c == 5) ? 1.0 : 0.0, (c == 2 || c == 3 || c == 5) ? 1.0 : 0.0);
    vW = mix(lo, hi, f);
    vec3 P = uM * vec3(vW, 1.0);
    gl_Position = vec4(2.0 * P.x / uView.x - P.z, P.z - 2.0 * P.y / uView.y, 0.0, P.z);
}`

const PRIM_FS = `${GLSL_HEAD}
uniform sampler2D uNoise;
uniform float uPpm;
uniform float uT;
uniform float uTan;
uniform float uRelief;
uniform float uFlat;
flat in vec4 vA;
flat in vec4 vB;
flat in vec4 vC;
in vec2 vW;
out vec4 o;
vec2 noise(vec2 p){
    vec2 s = p * ${NOISE_SIZE.toFixed(1)};
    vec2 i = floor(s);
    vec2 f = s - i;
    f = f * f * (3.0 - 2.0 * f);
    return texture(uNoise, (i + f + 0.5) / ${NOISE_SIZE.toFixed(1)}).rg - 0.5;
}
void main(){
    vec2 a = vA.xy;
    vec2 ab = vA.zw - a;
    float ra = vB.x;
    float rb = vB.y;
    float seed = vB.z;
    float irr = vB.w;
    vec2 rel = vW - a;
    if (vC.w < 0.5) {
        float m = dot(vC.xy, vC.xy);
        if (m > 1e-6) {
            float l = sqrt(m);
            vec2 u = vC.xy / l;
            float par = dot(rel, u);
            rel = u * par / (1.0 + l) + (rel - u * par) * (1.0 + l);
        }
        // the contact line's own shape: pinned drops are never round
        float k = 2.3 / ra;
        vec2 ph = vec2(seed * 37.0, seed * 91.0);
        rel += irr * ra * vec2(
            0.42 * sin(rel.y * k + ph.x) + 0.2 * sin(rel.x * k * 1.9 + ph.y * 1.3),
            0.42 * sin(rel.x * k * 1.1 + ph.y) + 0.2 * sin(rel.y * k * 1.7 + ph.x * 1.7));
        // and the glass's: dirt the line snags on, fixed to the pane
        rel += noise(vW * 0.0043 + seed) * min(0.11, ra * 0.3) * (0.35 + irr);
    } else {
        // a rivulet's edges wander with the pane, so joints stay continuous
        rel += noise(vW * 0.0021) * min(1.9, ra * 1.5) + noise(vW * 0.0071) * min(0.2, ra * 0.3);
    }
    float l2 = dot(ab, ab);
    float t = l2 > 1e-8 ? clamp(dot(rel, ab) / l2, 0.0, 1.0) : 0.0;
    // a tail eases out of its head; a rivulet's segments must not, or their joints ring
    float st = vC.w < 0.5 ? t * t * (3.0 - 2.0 * t) : t;
    float r = mix(ra, rb, st);
    vec2 d = rel - ab * t;
    // Gravity flattens a drop: a nearly level top and a steep meniscus at the rim,
    // not a dome. h = A(1 - (d²/R²)^n) keeps the rim slope 2·tan(θ/2) for any n, and
    // R is set so the height crosses the threshold exactly at the contact radius.
    float n = vC.w < 0.5 ? uFlat * (0.72 + 0.56 * fract(seed * 7.3)) : uFlat;
    float hc = max(r * uPpm * uTan / n, 1e-3);
    float A = uT + hc;
    float R2 = r * r * pow(A / hc, 1.0 / n);
    float q = 1.0 - pow(dot(d, d) / R2, n);
    if (q <= 0.0) discard;
    float f = A * q;
    if (vC.w < 0.5) {
        // A pinned drop's surface is not a clean dome: it keeps the ridges of the
        // water that gathered it. They fade out before the contact line, so they
        // shape what the lens shows and leave the outline alone.
        vec2 e = (vW - a) / ra;
        float ph = seed * 61.0;
        float bumps = sin(e.x * 3.1 + ph) * sin(e.y * 2.3 + ph * 1.7);
        float ridge = 1.0 - 2.0 * abs(sin(e.x * 1.3 + e.y * 2.9 + ph * 2.3));
        float rim = clamp(q * 3.0, 0.0, 1.0);
        // a big drop's weight smooths it out
        float heavy = 1.0 / (1.0 + ra * ra * 0.5);
        f *= 1.0 + irr * uRelief * rim * (bumps * 0.7 + ridge * 0.5 * heavy * heavy) * (0.45 + 0.55 * heavy);
    }
    f *= f;
    o = vC.w < 0.5 ? vec4(f, 0.0, 0.0, 0.0) : vec4(0.0, 0.0, 0.0, f);
}`

const compFS = (image: boolean) => `${GLSL_HEAD}
${image ? "#define IMAGE" : ""}
uniform sampler2D uH;
uniform sampler2D uEnv;
uniform sampler2D uImg;
uniform sampler2D uGrain;
uniform vec2 uCenter;
uniform float uUnit;
uniform float uT;
uniform vec3 uBg;
uniform vec3 uLight;
uniform float uIor;
uniform float uDist;
uniform vec4 uSky;
uniform float uSkyDrift;
uniform float uSkyLevel;
uniform vec3 uGround;
uniform vec4 uImgMap;
uniform float uImgLod;
uniform vec2 uGrainK;
uniform float uDim;
out vec4 o;
float H(ivec2 p){
    vec4 f = texelFetch(uH, p, 0);
    // Drops add, so they neck. A rivulet joins a drop at the drop's own level:
    // adding it would stand the head up as a dome on top of its own trail.
    return sqrt(max(f.r, f.a) + 0.25 * min(f.r, f.a));
}
float film(ivec2 p){
    vec4 f = texelFetch(uH, p, 0);
    return f.a / max(f.r + f.a, 1e-4);
}
vec3 back(vec2 b){
#ifdef IMAGE
    return textureLod(uImg, b * uImgMap.xy + uImgMap.zw, uImgLod).rgb;
#else
    return uBg + uLight * texture(uEnv, b / ${(ENV_RANGE * 2).toFixed(1)} + 0.5).r;
#endif
}
// The sky over the street. It is far away, so it is reached by the angle of a
// ray, not by where the ray started: only a steeply bent one gets there.
float sky(vec2 b, vec2 dir){
    float m = length(dir);
    // how high the ray climbs, and how nearly straight up it points
    float t = clamp((m + b.y * uSkyDrift - uSky.x) / uSky.y, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    float bx = clamp(b.x, -0.36, 0.36) * 0.9;
    float up = dir.y / max(m, 1e-4);
    float a = clamp((up - 0.2 + (dir.x / max(m, 1e-4)) * uSky.z) / uSky.w, 0.0, 1.0);
    return t * a * a * (3.0 - 2.0 * a) * clamp(0.62 + bx, 0.0, 1.0);
}
void main(){
    ivec2 p = ivec2(gl_FragCoord.xy);
    vec2 b = (gl_FragCoord.xy - uCenter) / uUnit;
    vec3 col = back(b);
    float h = H(p);
    if (h > uT * 0.4) {
        vec2 g = 0.5 * vec2(H(p + ivec2(1, 0)) - H(p - ivec2(1, 0)), H(p + ivec2(0, 1)) - H(p - ivec2(0, 1)));
        float s = length(g);
        float cov = clamp((h - uT) / max(s, 0.3) + 0.5, 0.0, 1.0);
        if (cov > 0.0) {
            vec2 nh = s > 1e-5 ? g / s : vec2(0.0);
            float sI = s / sqrt(1.0 + s * s);
            float sT = sI * uIor;
            vec3 wat = vec3(0.0);
            float leave = 1.0 - clamp((sT - 0.965) / 0.035, 0.0, 1.0);
            if (leave > 0.0) {
                float t = min(sT, 0.9995);
                float dl = asin(t) - asin(sI);
                vec2 dir = nh * tan(dl);
                // rays bent downward fall on the dark ground in front of the street
                float low = clamp((-dir.y - uGround.x) / uGround.y, 0.0, 1.0);
                low = low * low * (3.0 - 2.0 * low);
                wat = back(b + dir * uDist) * uDim * (1.0 - uGround.z * low) + uLight * uSkyLevel * sky(b, dir) * (1.0 - 0.75 * film(p));
                wat *= leave;
            }
            col = mix(col, wat, cov);
        }
    }
    vec2 gn = texture(uGrain, gl_FragCoord.xy * uGrainK.x).rg - 0.5;
    float L = dot(col, vec3(0.3333));
    col += (gn.x + gn.y * 0.6) * uGrainK.y * (0.004 + 0.075 * pow(max(L, 0.0), 0.42));
    o = vec4(col, 1.0);
}`

/* ---------------------------------------------------------------- */
/*  Props                                                            */
/* ---------------------------------------------------------------- */

interface Placement {
    x: number
    y: number
    angle: number
    tilt: number
}

interface Scene {
    image?: string | { src?: string; url?: string }
    offsetY: number
    blur: number
}

interface Gather {
    hover: boolean
    reach: number
    pull: number
    capacity: number
}

interface Advanced {
    seed: number
    contactAngle: number
    hysteresis: number
    refraction: number
    lensDistance: number
    skyLevel: number
    skyHeight: number
    skySoftness: number
    skyCentre: number
    skyWidth: number
    skyDrift: number
    groundStart: number
    groundSoftness: number
    groundDark: number
    dropDim: number
    grain: number
    viscosity: number
    trailWidth: number
    trailLife: number
    wobble: number
    relief: number
    flatness: number
}

export interface RainPaneProps {
    /** A picture to see through the glass. Empty keeps the out-of-focus street. */
    scene?: Partial<Scene>
    background?: string
    /** Colour of the light in the street and the sky. */
    lightColor?: string
    density?: number
    dropSize?: number
    /** How big the pane draws in its frame. Below 100% more of the glass shows. */
    scale?: number
    placement?: Partial<Placement>
    /** How the drops answer the pointer. */
    gather?: Partial<Gather>
    /** How hard a tap knocks on the glass. */
    knock?: number
    rain?: number
    runSpeed?: number
    advanced?: Partial<Advanced>
    style?: CSSProperties
}

const DEFAULT_BACKGROUND = "#000000"
const DEFAULT_LIGHT = "#ffffff"
const DEFAULT_SCENE: Scene = { image: undefined, offsetY: 0, blur: 5 }
const DEFAULT_PLACEMENT: Placement = { x: 0, y: 0, angle: 0, tilt: 0 }
const DEFAULT_GATHER: Gather = { hover: true, reach: 5, pull: 5, capacity: 5 }
const DEFAULT_ADVANCED: Advanced = {
    seed: 7,
    contactAngle: 60,
    hysteresis: 25,
    refraction: 1.33,
    lensDistance: 1.25,
    skyLevel: 1.15,
    skyHeight: 0.235,
    skySoftness: 0.08,
    skyCentre: 0.3,
    skyWidth: 0.6,
    skyDrift: 0.1,
    groundStart: 0.02,
    groundSoftness: 0.14,
    groundDark: 0.9,
    dropDim: 0.95,
    grain: 1,
    viscosity: 6,
    trailWidth: 30,
    trailLife: 40,
    wobble: 1,
    relief: 1.1,
    flatness: 1.4,
}

interface Merged {
    scene: Scene
    background: string
    lightColor: string
    density: number
    dropSize: number
    scale: number
    placement: Placement
    gather: Gather
    knock: number
    rain: number
    runSpeed: number
    advanced: Advanced
}

/* ---------------------------------------------------------------- */
/*  Small helpers                                                    */
/* ---------------------------------------------------------------- */

const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x)

const mulberry = (seed: number) => {
    let a = seed | 0
    return () => {
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

const parseColor = (c: string, fallback: [number, number, number]): [number, number, number] => {
    const s = (c || "").trim()
    let m = /^#([0-9a-f]{3,8})$/i.exec(s)
    if (m) {
        const h = m[1]
        if (h.length === 3 || h.length === 4) return [parseInt(h[0] + h[0], 16) / 255, parseInt(h[1] + h[1], 16) / 255, parseInt(h[2] + h[2], 16) / 255]
        if (h.length >= 6) return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]
    }
    m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(s)
    if (m) return [+m[1] / 255, +m[2] / 255, +m[3] / 255]
    return fallback
}

const imageSrc = (img: Scene["image"]): string => {
    if (!img) return ""
    if (typeof img === "string") return img
    return img.src || img.url || ""
}

/** Smooth 2-D value noise over a seeded, tiling table: the pinning landscape of the glass. */
const makeNoise = (seed: number) => {
    const N = 256
    const t = new Float32Array(N * N)
    const r = mulberry(seed)
    for (let i = 0; i < t.length; i++) t[i] = r()
    return (x: number, y: number) => {
        const fx = Math.floor(x)
        const fy = Math.floor(y)
        let u = x - fx
        let v = y - fy
        u = u * u * (3 - 2 * u)
        v = v * v * (3 - 2 * v)
        const i0 = fx & 255
        const j0 = fy & 255
        const i1 = (i0 + 1) & 255
        const j1 = (j0 + 1) & 255
        const a = t[j0 * N + i0]
        const b = t[j0 * N + i1]
        const c = t[j1 * N + i0]
        const d = t[j1 * N + i1]
        return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
    }
}

/* ---------------------------------------------------------------- */
/*  Water                                                            */
/* ---------------------------------------------------------------- */

const DEAD = 0
const PINNED = 1
const MOVING = 2
const MERGING = 3

const GRID = 128
const CELL_MM = 6
const WET_N = 256
const WET_MM = 1.5

interface Tuning {
    /** Pinning per mm of contact radius, mN/mm. */
    pin: number
    /** Cap volume per r³. */
    beta: number
    /** Volume at which a drop's weight beats its pinning. */
    vCrit: number
    /** Viscous drag per mm of radius. */
    drag: number
    trail: number
    life: number
    wobble: number
    gx: number
    gy: number
}

const tune = (A: Advanced, runSpeed: number, gx: number, gy: number): Tuning => {
    const th = (clamp(A.contactAngle, 20, 110) * Math.PI) / 180
    const hy = (clamp(A.hysteresis, 1, 60) * Math.PI) / 180
    const dc = Math.max(0.02, Math.cos(Math.max(0, th - hy)) - Math.cos(Math.min(Math.PI, th + hy)))
    const pin = 2 * SIGMA * dc
    const c = Math.cos(th)
    const s = Math.sin(th)
    const beta = (Math.PI * (2 - 3 * c + c * c * c)) / (3 * s * s * s)
    const rc = Math.sqrt(pin / (RHO_G * beta))
    return {
        pin,
        beta,
        vCrit: beta * rc * rc * rc,
        drag: (A.viscosity * 5e-4 * 5) / Math.max(0.5, runSpeed),
        trail: clamp(A.trailWidth, 10, 100) / 100,
        life: Math.max(1, A.trailLife),
        wobble: A.wobble,
        gx,
        gy,
    }
}

const makeWater = () => {
    const x = new Float32Array(MAX_DROPS)
    const y = new Float32Array(MAX_DROPS)
    const vx = new Float32Array(MAX_DROPS)
    const vy = new Float32Array(MAX_DROPS)
    const V = new Float32Array(MAX_DROPS)
    const r = new Float32Array(MAX_DROPS)
    const seed = new Float32Array(MAX_DROPS)
    const irr = new Float32Array(MAX_DROPS)
    const irrBase = new Float32Array(MAX_DROPS)
    const tx = new Float32Array(MAX_DROPS)
    const ty = new Float32Array(MAX_DROPS)
    const restX = new Float32Array(MAX_DROPS)
    const restY = new Float32Array(MAX_DROPS)
    const tipK = new Float32Array(MAX_DROPS)
    const ex = new Float32Array(MAX_DROPS)
    const ey = new Float32Array(MAX_DROPS)
    const evx = new Float32Array(MAX_DROPS)
    const evy = new Float32Array(MAX_DROPS)
    const pinK = new Float32Array(MAX_DROPS)
    const grow = new Float32Array(MAX_DROPS)
    const free = new Float64Array(MAX_DROPS)
    const acc = new Float32Array(MAX_DROPS)
    const beadAcc = new Float32Array(MAX_DROPS)
    const beadGap = new Float32Array(MAX_DROPS)
    const lastNode = new Int32Array(MAX_DROPS)
    const into = new Int32Array(MAX_DROPS)
    const state = new Uint8Array(MAX_DROPS)
    const inAct = new Uint8Array(MAX_DROPS)
    const nextInCell = new Int32Array(MAX_DROPS)
    const box = new Float32Array(MAX_DROPS * 4)
    const stack = new Int32Array(MAX_DROPS)
    const act = new Int32Array(MAX_DROPS)
    const cells = new Int32Array(GRID * GRID)
    const wet = new Float32Array(WET_N * WET_N)
    let stackN = 0
    let actN = 0
    let live = 0
    let maxExt = 4

    const nx = new Float32Array(MAX_NODES)
    const ny = new Float32Array(MAX_NODES)
    const nr = new Float32Array(MAX_NODES)
    const nTaper = new Float32Array(MAX_NODES)
    const nBead = new Float32Array(MAX_NODES)
    const nDie = new Float64Array(MAX_NODES)
    const nBorn = new Float64Array(MAX_NODES)
    const nPrev = new Int32Array(MAX_NODES)
    const nPrevGen = new Uint32Array(MAX_NODES)
    const nGen = new Uint32Array(MAX_NODES)
    const nAlive = new Uint8Array(MAX_NODES)
    const nBox = new Float32Array(MAX_NODES * 4)
    const nStack = new Int32Array(MAX_NODES)
    let nStackN = 0
    let nextDie = Infinity
    /** Nodes laid and drops lost since the last frame: both change pixels nothing else has marked. */
    const fresh = new Int32Array(4096)
    let freshN = 0
    const gone = new Int32Array(4096)
    let goneN = 0

    let pinNoise = makeNoise(11)
    let sideNoise = makeNoise(12)
    let rng = mulberry(1)

    const reset = (s: number) => {
        state.fill(DEAD)
        inAct.fill(0)
        nAlive.fill(0)
        wet.fill(-1e6)
        stackN = 0
        for (let i = MAX_DROPS - 1; i >= 0; i--) stack[stackN++] = i
        nStackN = 0
        for (let i = MAX_NODES - 1; i >= 0; i--) nStack[nStackN++] = i
        actN = 0
        live = 0
        nextDie = Infinity
        freshN = 0
        goneN = 0
        pinNoise = makeNoise(s * 31 + 11)
        sideNoise = makeNoise(s * 57 + 12)
        rng = mulberry(s * 977 + 5)
    }

    const wake = (i: number) => {
        if (state[i] === PINNED) state[i] = MOVING
        if (!inAct[i]) {
            inAct[i] = 1
            act[actN++] = i
        }
    }

    const setVolume = (i: number, v: number, T: Tuning) => {
        V[i] = v
        r[i] = Math.cbrt(v / T.beta)
    }

    const spawn = (px: number, py: number, rad: number, T: Tuning, shapeSeed: number, rough: number) => {
        if (stackN === 0) return -1
        const i = stack[--stackN]
        x[i] = px
        y[i] = py
        vx[i] = vy[i] = 0
        r[i] = rad
        V[i] = T.beta * rad * rad * rad
        seed[i] = shapeSeed
        irrBase[i] = rough
        irr[i] = rough
        tx[i] = ty[i] = restX[i] = restY[i] = 0
        tipK[i] = 0.45
        ex[i] = ey[i] = evx[i] = evy[i] = 0
        pinK[i] = 0.82 + 0.5 * shapeSeed
        grow[i] = 1
        free[i] = 0
        acc[i] = 0
        beadAcc[i] = 0
        beadGap[i] = 6
        lastNode[i] = -1
        into[i] = -1
        state[i] = PINNED
        // inAct stays: a recycled slot may still have its old entry on the list, which it reuses
        live++
        return i
    }

    const kill = (i: number) => {
        state[i] = DEAD
        stack[stackN++] = i
        live--
        if (goneN < gone.length) gone[goneN++] = i
    }

    const setRest = (i: number, ox: number, oy: number) => {
        restX[i] = ox
        restY[i] = oy
        tx[i] = ox
        ty[i] = oy
    }

    const addNode = (px: number, py: number, rad: number, prev: number, die: number, bead: number, born: number) => {
        if (nStackN === 0) return -1
        const k = nStack[--nStackN]
        nx[k] = px
        ny[k] = py
        nr[k] = rad
        nTaper[k] = 1
        nBead[k] = bead
        nDie[k] = die
        nBorn[k] = born
        nPrev[k] = prev
        nPrevGen[k] = prev >= 0 ? nGen[prev] : 0
        nAlive[k] = 1
        if (die < nextDie) nextDie = die
        if (freshN < fresh.length) fresh[freshN++] = k
        return k
    }

    const prevOf = (k: number) => {
        const p = nPrev[k]
        return p >= 0 && nAlive[p] && nGen[p] === nPrevGen[k] ? p : -1
    }

    /** Sows one block of glass. Same index, same drops. */
    const sow = (tileX: number, tileY: number, P: Merged, T: Tuning, floorMm: number, limit: number) => {
        const R = mulberry(Math.imul(tileX + 4099, 73856093) ^ Math.imul(tileY + 7013, 19349663) ^ Math.imul(P.advanced.seed + 1, 83492791))
        const dens = P.density / 5
        const n = Math.min(limit, Math.floor(25 * dens + R()))
        const size = (P.dropSize / 5) * 1
        for (let k = 0; k < n; k++) {
            const px = (tileX + R()) * TILE_MM
            const py = (tileY + R()) * TILE_MM
            const u = R()
            const rad = (0.1 + 0.88 * Math.pow(u, 3.2)) * size
            const sd = R()
            const rough = 0.14 + 0.36 * R()
            const up = R()
            const lean = (R() - 0.5) * 0.9
            const down = R() < 0.14
            const tipR = R()
            const lobe = R()
            if (rad < floorMm) continue
            const i = spawn(px, py, rad, T, sd, rough)
            if (i < 0) return
            const L = rad * (0.5 + 3.4 * up * up) * (down ? -1 : 1)
            setRest(i, Math.sin(lean) * L, -Math.cos(lean) * L)
            tipK[i] = 0.06 + 0.3 * tipR * tipR
            if (rad > 0.32 && lobe < 0.42) {
                const m = lobe < 0.18 ? 2 : 1
                for (let j = 0; j < m; j++) {
                    const a = R() * Math.PI * 2
                    const b = (0.55 + 0.45 * R()) * rad
                    const rl = (0.4 + 0.4 * R()) * rad
                    const q = spawn(px + Math.cos(a) * b, py + Math.sin(a) * b * 1.3, rl, T, R(), rough)
                    if (q >= 0) {
                        const L2 = rl * (0.4 + 2 * R())
                        setRest(q, Math.sin(lean) * L2, -Math.cos(lean) * L2)
                        tipK[q] = 0.08 + 0.3 * R()
                    }
                }
            }
        }
    }

    /** The composition's own drops and rivulets, which sit at the reference's scale. */
    const layOut = (P: Merged, T: Tuning, now: number) => {
        const R = mulberry(P.advanced.seed * 131 + 3)
        const size = P.dropSize / 5
        for (const a of ANCHORS) {
            const rad = a[2] * MM_PER_REF_PX * size
            const i = spawn((a[0] - REF_W / 2) * MM_PER_REF_PX, (a[1] - REF_H / 2) * MM_PER_REF_PX, rad, T, R(), 0.2 + 0.25 * R())
            if (i < 0) break
            const L = a[3] * MM_PER_REF_PX * size
            setRest(i, Math.sin(a[4]) * L, -Math.cos(a[4]) * L)
            tipK[i] = 0.1 + 0.3 * R()
            // the anchors are the frame's biggest: they stay until something joins them
            pinK[i] = Math.max(pinK[i], (1.12 * V[i]) / T.vCrit)
            if (a[2] > 30) {
                irr[i] = irrBase[i] = 0.12
                // seeds that give the head a flat top and the big drop a full dome
                seed[i] = a[2] > 40 ? 0.0069 : 0.0753
            }
        }
        for (const path of RIVULETS) {
            let prev = -1
            const die = now + T.life * (1.1 + R())
            for (let s = 0; s < path.length - 1; s++) {
                const p0 = path[Math.max(0, s - 1)]
                const p1 = path[s]
                const p2 = path[s + 1]
                const p3 = path[Math.min(path.length - 1, s + 2)]
                const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * MM_PER_REF_PX
                const m = Math.max(1, Math.ceil(len / 0.8))
                for (let q = 0; q < m; q++) {
                    const t = q / m
                    const t2 = t * t
                    const t3 = t2 * t
                    const cr = (v0: number, v1: number, v2: number, v3: number) =>
                        0.5 * (2 * v1 + (v2 - v0) * t + (2 * v0 - 5 * v1 + 4 * v2 - v3) * t2 + (3 * v1 - v0 - 3 * v2 + v3) * t3)
                    const px = (cr(p0[0], p1[0], p2[0], p3[0]) - REF_W / 2) * MM_PER_REF_PX
                    const py = (cr(p0[1], p1[1], p2[1], p3[1]) - REF_H / 2) * MM_PER_REF_PX
                    const rad = cr(p0[2], p1[2], p2[2], p3[2]) * MM_PER_REF_PX * size
                    prev = addNode(px, py, rad, prev, die + (s + t) * 0.35, R() < 0.12 ? rad * 0.7 : 0, now - 10)
                }
            }
        }
    }

    const rebuildGrid = () => {
        cells.fill(-1)
        let ext = 1
        for (let s = 0; s < MAX_DROPS; s++) {
            if (state[s] === DEAD) continue
            const mx = x[s] + tx[s] * 0.5
            const my = y[s] + ty[s] * 0.5
            const c = (((mx / CELL_MM) & (GRID - 1)) + ((my / CELL_MM) & (GRID - 1)) * GRID) | 0
            nextInCell[s] = cells[c]
            cells[c] = s
            const e = r[s] + Math.abs(tx[s]) * 0.5 + Math.abs(ty[s]) * 0.5
            if (e > ext) ext = e
        }
        maxExt = ext
    }

    const cellOf = (v: number) => Math.floor(v / CELL_MM)

    /** Distance from a point to a drop's capsule, less the capsule's own radius there. */
    const gapTo = (px: number, py: number, j: number) => {
        const ax = x[j]
        const ay = y[j]
        const bx = tx[j]
        const by = ty[j]
        const l2 = bx * bx + by * by
        let t = 0
        if (l2 > 1e-6) t = clamp(((px - ax) * bx + (py - ay) * by) / l2, 0, 1)
        const dx = px - ax - bx * t
        const dy = py - ay - by * t
        const taper = Math.min(1, Math.sqrt(l2) / (2 * r[j]))
        const tip = 1 - (1 - tipK[j]) * taper * taper
        return Math.sqrt(dx * dx + dy * dy) - r[j] * (1 + (tip - 1) * t * t * (3 - 2 * t))
    }

    const merge = (big: number, small: number) => {
        state[small] = MERGING
        into[small] = big
        wake(small)
        wake(big)
    }

    const wetAt = (px: number, py: number) => {
        const c = ((Math.floor(px / WET_MM) & (WET_N - 1)) + (Math.floor(py / WET_MM) & (WET_N - 1)) * WET_N) | 0
        return wet[c]
    }

    const stampWet = (px: number, py: number, rad: number, now: number) => {
        const n = Math.ceil(rad * 0.8 / WET_MM)
        const cx = Math.floor(px / WET_MM)
        const cy = Math.floor(py / WET_MM)
        for (let j = -n; j <= n; j++) {
            for (let i = -n; i <= n; i++) {
                wet[((cx + i) & (WET_N - 1)) + ((cy + j) & (WET_N - 1)) * WET_N] = now
            }
        }
    }

    /** Reach is not a circle: each drop lets go at its own distance, and specks stay behind. */
    const reachShare = (i: number) => (r[i] < 0.24 && seed[i] < 0.6 ? 0 : 0.6 + 0.5 * seed[i])

    const knock = { t: -1e6, x: 0, y: 0, reach: 1, power: 0 }
    const ptr = { on: false, x: 0, y: 0, reach: 0, pull: 0 }
    let hold = -1

    const stepDrops = (dt: number, now: number, T: Tuning) => {
        const pin = T.pin
        const gx = T.gx
        const gy = T.gy
        const anchor = hold >= 0 ? hold : -1
        for (let a = actN - 1; a >= 0; a--) {
            const i = act[a]
            if (state[i] === DEAD) {
                act[a] = act[--actN]
                inAct[i] = 0
                continue
            }
            // capillary wobble: the mode a merged drop rings in, slowed so it can be seen
            if (ex[i] !== 0 || ey[i] !== 0 || evx[i] !== 0 || evy[i] !== 0) {
                const w = clamp(46 * Math.pow(1.5 / Math.max(0.3, r[i]), 1.5), 12, 60)
                const z = 2 * 0.14 * w
                evx[i] += (-w * w * ex[i] - z * evx[i]) * dt
                evy[i] += (-w * w * ey[i] - z * evy[i]) * dt
                ex[i] = clamp(ex[i] + evx[i] * dt, -0.32, 0.32)
                ey[i] = clamp(ey[i] + evy[i] * dt, -0.32, 0.32)
                if (Math.abs(ex[i]) + Math.abs(ey[i]) < 0.0015 && Math.abs(evx[i]) + Math.abs(evy[i]) < 0.03) {
                    ex[i] = ey[i] = evx[i] = evy[i] = 0
                }
            }
            if (grow[i] < 1) grow[i] = Math.min(1, grow[i] + dt / 0.05)

            if (state[i] === MERGING) {
                let b = into[i]
                while (b >= 0 && state[b] === MERGING) b = into[b]
                if (b < 0 || state[b] === DEAD) {
                    state[i] = MOVING
                    continue
                }
                into[i] = b
                const k = 1 - Math.exp(-dt / 0.045)
                const dV = V[i] * k
                setVolume(i, V[i] - dV, T)
                setVolume(b, V[b] + dV, T)
                const f = dV / V[b]
                const dx = x[i] - x[b]
                const dy = y[i] - y[b]
                x[b] += dx * f
                y[b] += dy * f
                vx[b] += (vx[i] - vx[b]) * f
                vy[b] += (vy[i] - vy[b]) * f
                const d = Math.sqrt(dx * dx + dy * dy) + 1e-4
                evx[b] += (dx / d) * f * 34 * T.wobble
                evy[b] += (dy / d) * f * 34 * T.wobble
                x[i] -= dx * k * 1.2
                y[i] -= dy * k * 1.2
                if (r[i] < 0.09) {
                    setVolume(b, V[b] + V[i], T)
                    kill(i)
                }
                continue
            }
            if (state[i] !== MOVING) continue

            const inv = 1e6 / V[i]
            const fgx = RHO_G * V[i] * gx
            const fgy = RHO_G * V[i] * gy
            let fx = fgx
            let fy = fgy
            // the glass is not uniform: wetted tracks pin less, dirt pins more
            const wetAge = now - wetAt(x[i], y[i])
            const wetK = wetAge < 120 ? 1 - 0.65 * Math.exp(-wetAge / 40) : 1
            let P = pin * r[i] * pinK[i] * wetK * (0.55 + 0.9 * pinNoise(x[i] * 0.85, y[i] * 0.85))
            const kt = now - knock.t
            if (kt < 1.5) {
                const d = Math.hypot(x[i] - knock.x, y[i] - knock.y) / knock.reach
                if (d < 1) P *= 1 - knock.power * (1 - d) * Math.exp(-kt / 0.3)
            }
            let pulled = false
            if (ptr.on && i !== anchor && now >= free[i]) {
                const tx0 = anchor >= 0 ? x[anchor] : ptr.x
                const ty0 = anchor >= 0 ? y[anchor] : ptr.y
                const dx = tx0 - x[i]
                const dy = ty0 - y[i]
                const d = Math.sqrt(dx * dx + dy * dy)
                const reach = ptr.reach * reachShare(i)
                if (d < reach && d > 1e-3) {
                    const w = 1 - d / reach
                    // a contact-line force: ∝ r like the pinning it beats, so every size follows
                    const F = pin * r[i] * pinK[i] * (1.08 + ptr.pull * (0.25 + 1.15 * w * w))
                    fx += (dx / d) * F
                    fy += (dy / d) * F
                    pulled = true
                }
            }
            const moving = vx[i] !== 0 || vy[i] !== 0
            if (i !== anchor) {
                if (!moving) {
                    if (Math.sqrt(fx * fx + fy * fy) < P) continue
                }
                // a run wanders across the glass and leans into wet tracks
                const side = (sideNoise(x[i] * 0.09, y[i] * 0.05 + seed[i] * 40) - 0.5) * 0.9
                const look = r[i] + 1.5
                const wa = wetAt(x[i] + gy * look + gx * look, y[i] - gx * look + gy * look)
                const wb = wetAt(x[i] - gy * look + gx * look, y[i] + gx * look + gy * look)
                const steer = clamp((wa - wb) * 0.2, -0.45, 0.45)
                const fg = RHO_G * V[i]
                fx += gy * fg * (side + steer)
                fy += -gx * fg * (side + steer)
                vx[i] += fx * inv * dt
                vy[i] += fy * inv * dt
                let sp = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i])
                const fr = KINETIC_PIN * P * inv * dt
                if (sp <= fr) {
                    vx[i] = vy[i] = 0
                    continue
                }
                let k = (sp - fr) / sp
                k /= 1 + T.drag * r[i] * inv * dt
                vx[i] *= k
                vy[i] *= k
                sp *= k
                if (sp > MAX_SPEED) {
                    vx[i] *= MAX_SPEED / sp
                    vy[i] *= MAX_SPEED / sp
                }
                if (sp < STOP_SPEED && Math.sqrt(fx * fx + fy * fy) < P) {
                    vx[i] = vy[i] = 0
                    continue
                }
            }
            const mx = vx[i] * dt
            const my = vy[i] * dt
            x[i] += mx
            y[i] += my
            const ds = Math.sqrt(mx * mx + my * my)
            if (ds > 0) {
                const speed = ds / dt
                if (r[i] > 0.55 && speed > 6) stampWet(x[i], y[i], r[i], now)
                // Only real runs lay a rivulet. A small drop coaxed along leaves nothing
                // that shows, and a pull's trail is a thin film that dries at once.
                if (r[i] > (pulled ? 1.3 : 0.85) && speed > 6) {
                    acc[i] += ds
                    const tr = r[i] * T.trail * (0.72 + 0.56 * sideNoise(x[i] * 0.16, y[i] * 0.16))
                    const gap = 0.5
                    if (acc[i] >= gap) {
                        acc[i] = 0
                        beadAcc[i] += gap
                        let bead = 0
                        if (beadAcc[i] >= beadGap[i]) {
                            beadAcc[i] = 0
                            beadGap[i] = tr * (3 + 5 * rng())
                            bead = tr * (0.3 + 0.5 * rng())
                        }
                        const prev = lastNode[i]
                        const px = prev >= 0 ? nx[prev] + (x[i] - nx[prev]) * 0.4 : x[i]
                        const py = prev >= 0 ? ny[prev] + (y[i] - ny[prev]) * 0.4 : y[i]
                        const pr = prev >= 0 ? nr[prev] + (tr - nr[prev]) * 0.25 : tr
                        const die = pulled ? now + 1.2 + rng() : i === anchor ? now + T.life * 0.25 : now + T.life * (0.8 + 0.4 * seed[i])
                        lastNode[i] = addNode(px, py, pr, prev, die, bead, now)
                        const cost = 0.28 * tr * tr * gap
                        if (V[i] > cost * 4) setVolume(i, V[i] - cost, T)
                    }
                } else {
                    lastNode[i] = -1
                }
                // what it touches, it swallows
                const reach = r[i] + maxExt + 0.5
                const cx0 = cellOf(x[i] - reach)
                const cx1 = cellOf(x[i] + reach)
                const cy0 = cellOf(y[i] - reach)
                const cy1 = cellOf(y[i] + reach)
                for (let cy = cy0; cy <= cy1; cy++) {
                    for (let cx = cx0; cx <= cx1; cx++) {
                        let j = cells[(cx & (GRID - 1)) + (cy & (GRID - 1)) * GRID]
                        while (j >= 0) {
                            const nx1 = nextInCell[j]
                            if (j !== i && (state[j] === PINNED || state[j] === MOVING) && gapTo(x[i], y[i], j) < r[i] * 0.86) {
                                if (V[i] >= V[j]) merge(i, j)
                                else merge(j, i)
                                if (state[i] !== MOVING) break
                            }
                            j = nx1
                        }
                        if (state[i] !== MOVING) break
                    }
                    if (state[i] !== MOVING) break
                }
            }
        }
    }

    return {
        x,
        y,
        vx,
        vy,
        V,
        r,
        seed,
        irr,
        irrBase,
        tx,
        ty,
        restX,
        restY,
        tipK,
        ex,
        ey,
        evx,
        evy,
        grow,
        free,
        state,
        inAct,
        act,
        box,
        nx,
        ny,
        nr,
        nTaper,
        nBead,
        nDie,
        nBorn,
        nAlive,
        nBox,
        nGen,
        knock,
        ptr,
        reset,
        wake,
        reachShare,
        spawn,
        kill,
        setRest,
        setVolume,
        addNode,
        prevOf,
        sow,
        layOut,
        rebuildGrid,
        gapTo,
        cellOf,
        cells,
        nextInCell,
        stepDrops,
        merge,
        random: () => rng(),
        get live() {
            return live
        },
        get actN() {
            return actN
        },
        set actN(v: number) {
            actN = v
        },
        get hold() {
            return hold
        },
        set hold(v: number) {
            hold = v
        },
        get nextDie() {
            return nextDie
        },
        set nextDie(v: number) {
            nextDie = v
        },
        fresh,
        gone,
        get freshN() {
            return freshN
        },
        set freshN(v: number) {
            freshN = v
        },
        get goneN() {
            return goneN
        },
        set goneN(v: number) {
            goneN = v
        },
        freeNode: (k: number) => {
            nAlive[k] = 0
            nGen[k]++
            nStack[nStackN++] = k
        },
        maxExt: () => maxExt,
    }
}

type Water = ReturnType<typeof makeWater>

/* ---------------------------------------------------------------- */
/*  GL                                                               */
/* ---------------------------------------------------------------- */

interface CompUniforms {
    uH: WebGLUniformLocation | null
    uEnv: WebGLUniformLocation | null
    uImg: WebGLUniformLocation | null
    uGrain: WebGLUniformLocation | null
    uCenter: WebGLUniformLocation | null
    uUnit: WebGLUniformLocation | null
    uT: WebGLUniformLocation | null
    uBg: WebGLUniformLocation | null
    uLight: WebGLUniformLocation | null
    uIor: WebGLUniformLocation | null
    uDist: WebGLUniformLocation | null
    uSky: WebGLUniformLocation | null
    uSkyDrift: WebGLUniformLocation | null
    uSkyLevel: WebGLUniformLocation | null
    uGround: WebGLUniformLocation | null
    uImgMap: WebGLUniformLocation | null
    uImgLod: WebGLUniformLocation | null
    uGrainK: WebGLUniformLocation | null
    uDim: WebGLUniformLocation | null
}

interface GLState {
    gl: WebGL2RenderingContext
    vao: WebGLVertexArrayObject
    prim: WebGLProgram
    uPrim: {
        uData: WebGLUniformLocation | null
        uNoise: WebGLUniformLocation | null
        uM: WebGLUniformLocation | null
        uView: WebGLUniformLocation | null
        uPpm: WebGLUniformLocation | null
        uT: WebGLUniformLocation | null
        uTan: WebGLUniformLocation | null
        uRelief: WebGLUniformLocation | null
        uFlat: WebGLUniformLocation | null
    }
    comp: WebGLProgram
    uComp: CompUniforms
    compImg: WebGLProgram
    uCompImg: CompUniforms
    data: WebGLTexture
    noise: WebGLTexture
    grain: WebGLTexture
    env: WebGLTexture
    img: WebGLTexture
    hTex: WebGLTexture
    hFbo: WebGLFramebuffer
    cTex: WebGLTexture
    cFbo: WebGLFramebuffer
}

const compile = (gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram | null => {
    const p = gl.createProgram()
    const v = gl.createShader(gl.VERTEX_SHADER)
    const f = gl.createShader(gl.FRAGMENT_SHADER)
    if (!p || !v || !f) return null
    gl.shaderSource(v, vs)
    gl.compileShader(v)
    gl.shaderSource(f, fs)
    gl.compileShader(f)
    gl.attachShader(p, v)
    gl.attachShader(p, f)
    gl.linkProgram(p)
    gl.deleteShader(v)
    gl.deleteShader(f)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        if (!gl.isContextLost()) console.warn("RainPane: ", gl.getProgramInfoLog(p))
        gl.deleteProgram(p)
        return null
    }
    return p
}

const compUniforms = (gl: WebGL2RenderingContext, p: WebGLProgram): CompUniforms => ({
    uH: gl.getUniformLocation(p, "uH"),
    uEnv: gl.getUniformLocation(p, "uEnv"),
    uImg: gl.getUniformLocation(p, "uImg"),
    uGrain: gl.getUniformLocation(p, "uGrain"),
    uCenter: gl.getUniformLocation(p, "uCenter"),
    uUnit: gl.getUniformLocation(p, "uUnit"),
    uT: gl.getUniformLocation(p, "uT"),
    uBg: gl.getUniformLocation(p, "uBg"),
    uLight: gl.getUniformLocation(p, "uLight"),
    uIor: gl.getUniformLocation(p, "uIor"),
    uDist: gl.getUniformLocation(p, "uDist"),
    uSky: gl.getUniformLocation(p, "uSky"),
    uSkyDrift: gl.getUniformLocation(p, "uSkyDrift"),
    uSkyLevel: gl.getUniformLocation(p, "uSkyLevel"),
    uGround: gl.getUniformLocation(p, "uGround"),
    uImgMap: gl.getUniformLocation(p, "uImgMap"),
    uImgLod: gl.getUniformLocation(p, "uImgLod"),
    uGrainK: gl.getUniformLocation(p, "uGrainK"),
    uDim: gl.getUniformLocation(p, "uDim"),
})

const noiseTexels = (seed: number, smooth: number) => {
    const N = NOISE_SIZE
    const R = mulberry(seed)
    const a = new Float32Array(N * N)
    const b = new Float32Array(N * N)
    for (let i = 0; i < a.length; i++) {
        a[i] = R()
        b[i] = R()
    }
    const blur = (src: Float32Array) => {
        const t = new Float32Array(N * N)
        for (let pass = 0; pass < smooth; pass++) {
            for (let y = 0; y < N; y++) {
                for (let x = 0; x < N; x++) {
                    t[y * N + x] = (src[y * N + ((x + N - 1) % N)] + 2 * src[y * N + x] + src[y * N + ((x + 1) % N)]) / 4
                }
            }
            for (let y = 0; y < N; y++) {
                for (let x = 0; x < N; x++) {
                    src[y * N + x] = (t[((y + N - 1) % N) * N + x] + 2 * t[y * N + x] + t[((y + 1) % N) * N + x]) / 4
                }
            }
        }
    }
    blur(a)
    blur(b)
    // stretch back to full range: blurring gathers noise around 0.5
    let lo = 1
    let hi = 0
    for (let i = 0; i < a.length; i++) {
        lo = Math.min(lo, a[i], b[i])
        hi = Math.max(hi, a[i], b[i])
    }
    const out = new Uint8Array(N * N * 2)
    const k = 255 / Math.max(1e-6, hi - lo)
    for (let i = 0; i < a.length; i++) {
        out[i * 2] = (a[i] - lo) * k
        out[i * 2 + 1] = (b[i] - lo) * k
    }
    return out
}

const makeTex = (gl: WebGL2RenderingContext, filter: number, wrap: number) => {
    const t = gl.createTexture()
    if (!t) return null
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap)
    return t
}

const initGL = (canvas: HTMLCanvasElement): GLState | null => {
    const gl = canvas.getContext("webgl2", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "low-power",
        preserveDrawingBuffer: false,
    })
    if (!gl) return null
    // the field needs float blending targets; without them the Background stands
    if (!gl.getExtension("EXT_color_buffer_float") && !gl.getExtension("EXT_color_buffer_half_float")) return null
    const prim = compile(gl, PRIM_VS, PRIM_FS)
    const comp = compile(gl, QUAD_VS, compFS(false))
    const compImg = compile(gl, QUAD_VS, compFS(true))
    const envP = compile(gl, QUAD_VS, ENV_FS)
    const vao = gl.createVertexArray()
    const data = makeTex(gl, gl.NEAREST, gl.CLAMP_TO_EDGE)
    const noise = makeTex(gl, gl.LINEAR, gl.REPEAT)
    const grain = makeTex(gl, gl.LINEAR, gl.REPEAT)
    const env = makeTex(gl, gl.LINEAR, gl.CLAMP_TO_EDGE)
    const img = makeTex(gl, gl.LINEAR, gl.MIRRORED_REPEAT)
    const hTex = makeTex(gl, gl.NEAREST, gl.CLAMP_TO_EDGE)
    const cTex = makeTex(gl, gl.NEAREST, gl.CLAMP_TO_EDGE)
    const hFbo = gl.createFramebuffer()
    const cFbo = gl.createFramebuffer()
    const eFbo = gl.createFramebuffer()
    if (!prim || !comp || !compImg || !envP || !vao || !data || !noise || !grain || !env || !img || !hTex || !cTex || !hFbo || !cFbo || !eFbo) return null

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.bindTexture(gl.TEXTURE_2D, data)
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, DATA_W, DATA_H)
    gl.bindTexture(gl.TEXTURE_2D, noise)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, NOISE_SIZE, NOISE_SIZE, 0, gl.RG, gl.UNSIGNED_BYTE, noiseTexels(41, 2))
    gl.bindTexture(gl.TEXTURE_2D, grain)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, NOISE_SIZE, NOISE_SIZE, 0, gl.RG, gl.UNSIGNED_BYTE, noiseTexels(97, 1))

    // The street, baked once: it is only ever tone, the colours are applied per pixel.
    gl.bindTexture(gl.TEXTURE_2D, env)
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, ENV_SIZE, ENV_SIZE)
    gl.bindFramebuffer(gl.FRAMEBUFFER, eFbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, env, 0)
    gl.viewport(0, 0, ENV_SIZE, ENV_SIZE)
    gl.useProgram(envP)
    gl.bindVertexArray(vao)
    gl.disable(gl.BLEND)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    gl.bindVertexArray(null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.deleteFramebuffer(eFbo)
    gl.deleteProgram(envP)

    return {
        gl,
        vao,
        prim,
        uPrim: {
            uData: gl.getUniformLocation(prim, "uData"),
            uNoise: gl.getUniformLocation(prim, "uNoise"),
            uM: gl.getUniformLocation(prim, "uM"),
            uView: gl.getUniformLocation(prim, "uView"),
            uPpm: gl.getUniformLocation(prim, "uPpm"),
            uT: gl.getUniformLocation(prim, "uT"),
            uTan: gl.getUniformLocation(prim, "uTan"),
            uRelief: gl.getUniformLocation(prim, "uRelief"),
            uFlat: gl.getUniformLocation(prim, "uFlat"),
        },
        comp,
        uComp: compUniforms(gl, comp),
        compImg,
        uCompImg: compUniforms(gl, compImg),
        data,
        noise,
        grain,
        env,
        img,
        hTex,
        hFbo,
        cTex,
        cFbo,
    }
}

/* ---------------------------------------------------------------- */
/*  Component                                                        */
/* ---------------------------------------------------------------- */

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 1150
 */
export default function RainPane({
    scene,
    background = "#000000",
    lightColor = "#ffffff",
    density = 5,
    dropSize = 5,
    scale = 100,
    placement,
    gather,
    knock = 5,
    rain = 3,
    runSpeed = 5,
    advanced,
    style,
}: RainPaneProps) {
    const rootRef = useRef<HTMLDivElement>(null)
    const glRef = useRef<HTMLCanvasElement>(null)

    const merged: Merged = {
        scene: { ...DEFAULT_SCENE, ...scene },
        background,
        lightColor,
        density,
        dropSize,
        scale,
        placement: { ...DEFAULT_PLACEMENT, ...placement },
        gather: { ...DEFAULT_GATHER, ...gather },
        knock,
        rain,
        runSpeed,
        advanced: { ...DEFAULT_ADVANCED, ...advanced },
    }
    const propsRef = useRef<Merged>(merged)
    propsRef.current = merged
    const wakeRef = useRef<(() => void) | null>(null)
    const key = JSON.stringify(merged)
    useEffect(() => {
        wakeRef.current?.()
    }, [key])

    useEffect(() => {
        const root = rootRef.current
        const canvas = glRef.current
        if (!root || !canvas) return

        const W = makeWater()
        let G: GLState | null = initGL(canvas)
        let lost = false

        // layout + buffer
        let cssW = 0
        let cssH = 0
        let shown = 1
        let qi = 0
        let bufW = 0
        let bufH = 0
        let bufScale = 1
        let targetsDirty = true
        let tw = 0
        let th = 0
        let tiles = new Uint8Array(0)
        let anyDirty = false
        let allDirty = true
        let viewKey = ""
        let compKey = ""
        let sowKey = ""

        // frame → world, one map for the drops, the pointer and everything else
        const M = new Float32Array(9)
        const Minv = new Float64Array(9)
        let ppm = 1
        let thresh = 1
        let tanHalf = 0.577
        let flat = 1.7
        const bounds = [0, 0, 0, 0]
        const sown = new Set<number>()
        let T: Tuning = tune(DEFAULT_ADVANCED, 5, 0, 1)
        let floorMm = 0

        // pointer
        let ptrIn = false
        let ptrX = 0
        let ptrY = 0
        let ptrMoved = false
        let rect: DOMRect | null = null
        let wantKnock = false
        let wantDrop = false
        let reachNow = 0

        // image
        let imgSrc = ""
        let imgReady = false
        let imgW = 1
        let imgH = 1

        // time
        let clock = 0
        let subAcc = 0
        let rainAcc = 0
        let runAcc = 0.3
        let visible = true
        let pageVisible = typeof document === "undefined" ? true : !document.hidden
        let running = false
        let raf = 0
        let lastTick = 0
        let lastDraw = 0
        let sleepAt = 0
        let idleTimer = 0
        const gaps: number[] = []
        let divisor = 1
        let slowMs = 0
        let goodMs = 0
        let probeAt = 0
        const banUntil = [0, 0, 0, 0]
        let drawnFrames = 0

        const reduce = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null
        const reduced = () => !!reduce && reduce.matches

        const scratch = new Float32Array(MAX_PRIMS * PRIM_FLOATS)
        const rects = new Int32Array(MAX_RECTS * 4)
        const rectCounts = new Int32Array(MAX_RECTS)
        let rectN = 0

        const deviceScale = () => {
            const dpr = Math.min(2, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1)
            let k = Math.min(2, dpr * clamp(shown, 1, 2))
            if (cssW * cssH * k * k > PIXEL_BUDGET) k = Math.sqrt(PIXEL_BUDGET / (cssW * cssH))
            return Math.max(0.5, k)
        }

        const ensureTargets = () => {
            if (!G) return
            const k = deviceScale() * LADDER[qi]
            const w = Math.max(1, Math.round(cssW * k))
            const h = Math.max(1, Math.round(cssH * k))
            if (w === bufW && h === bufH && !targetsDirty) return
            targetsDirty = false
            bufW = w
            bufH = h
            bufScale = k
            if (canvas.width !== w) canvas.width = w
            if (canvas.height !== h) canvas.height = h
            const gl = G.gl
            gl.bindTexture(gl.TEXTURE_2D, G.hTex)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null)
            gl.bindFramebuffer(gl.FRAMEBUFFER, G.hFbo)
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, G.hTex, 0)
            gl.bindTexture(gl.TEXTURE_2D, G.cTex)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
            gl.bindFramebuffer(gl.FRAMEBUFFER, G.cFbo)
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, G.cTex, 0)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
            tw = Math.ceil(w / DIRTY_TILE)
            th = Math.ceil(h / DIRTY_TILE)
            tiles = new Uint8Array(tw * th)
            allDirty = true
            viewKey = ""
        }

        /** Rebuilds the frame → world map and everything cached in screen space. */
        const updateView = () => {
            const P = propsRef.current
            const pl = P.placement
            const A = P.advanced
            const key = [bufW, bufH, P.scale, pl.x, pl.y, pl.angle, pl.tilt, A.contactAngle, A.flatness].join("|")
            const ang = (pl.angle * Math.PI) / 180
            const tilt = (clamp(pl.tilt, -75, 75) * Math.PI) / 180
            const S = Math.min(bufH, bufW / REF_ASPECT)
            ppm = (S * (P.scale / 100)) / MM_PER_H
            thresh = Math.max(0.9, bufScale)
            tanHalf = Math.tan((clamp(A.contactAngle, 20, 110) * Math.PI) / 360) * LENS_SLOPE
            flat = clamp(A.flatness, 1, 4)
            T = tune(A, P.runSpeed, Math.sin(ang), Math.cos(ang))
            if (key === viewKey) return
            viewKey = key
            const cx = bufW / 2 + (pl.x / 100) * bufW
            const cy = bufH / 2 + (pl.y / 100) * bufH
            const ca = Math.cos(ang)
            const sa = Math.sin(ang)
            const ct = Math.cos(tilt)
            const st = Math.sin(tilt)
            // Angle in the plane, Tilt under a perspective, offsets last.
            const persp = 1 / (2.4 * S)
            const m00 = ppm * ca
            const m01 = -ppm * sa
            const m10 = ppm * sa * ct
            const m11 = ppm * ca * ct
            const w0 = -ppm * sa * st * persp
            const w1 = -ppm * ca * st * persp
            // column-major: x' = m00 x + m01 y + cx·w, y' likewise, w = w0 x + w1 y + 1
            M[0] = m00 + cx * w0
            M[1] = m10 + cy * w0
            M[2] = w0
            M[3] = m01 + cx * w1
            M[4] = m11 + cy * w1
            M[5] = w1
            M[6] = cx
            M[7] = cy
            M[8] = 1
            const a = M[0]
            const b = M[3]
            const c = M[6]
            const d = M[1]
            const e = M[4]
            const f = M[7]
            const g = M[2]
            const h = M[5]
            const i = M[8]
            const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
            const id = 1 / det
            Minv[0] = (e * i - f * h) * id
            Minv[1] = (c * h - b * i) * id
            Minv[2] = (b * f - c * e) * id
            Minv[3] = (f * g - d * i) * id
            Minv[4] = (a * i - c * g) * id
            Minv[5] = (c * d - a * f) * id
            Minv[6] = (d * h - e * g) * id
            Minv[7] = (b * g - a * h) * id
            Minv[8] = (a * e - b * d) * id
            let x0 = 1e9
            let x1 = -1e9
            let y0 = 1e9
            let y1 = -1e9
            for (let q = 0; q < 4; q++) {
                const sx = q & 1 ? bufW : 0
                const sy = q & 2 ? bufH : 0
                const ww = Minv[6] * sx + Minv[7] * sy + Minv[8]
                const wx = (Minv[0] * sx + Minv[1] * sy + Minv[2]) / ww
                const wy = (Minv[3] * sx + Minv[4] * sy + Minv[5]) / ww
                x0 = Math.min(x0, wx)
                x1 = Math.max(x1, wx)
                y0 = Math.min(y0, wy)
                y1 = Math.max(y1, wy)
            }
            bounds[0] = x0 - 6
            bounds[1] = y0 - 6
            bounds[2] = x1 + 6
            bounds[3] = y1 + 6
            allDirty = true
        }

        const toWorld = (sx: number, sy: number, out: number[]) => {
            const ww = Minv[6] * sx + Minv[7] * sy + Minv[8]
            out[0] = (Minv[0] * sx + Minv[1] * sy + Minv[2]) / ww
            out[1] = (Minv[3] * sx + Minv[4] * sy + Minv[5]) / ww
        }

        /** Sows every block the view can see, and lays the composition out once. */
        const sowView = () => {
            const P = propsRef.current
            const key = [P.density, P.dropSize, P.advanced.seed, P.scale].join("|")
            if (key !== sowKey) {
                sowKey = key
                sown.clear()
                W.reset(P.advanced.seed)
                W.hold = -1
                // below half a CSS pixel a drop is grain, not water
                floorMm = (0.45 * MM_PER_H) / (Math.max(1, Math.min(cssH, cssW / REF_ASPECT)) * (P.scale / 100))
                W.layOut(P, T, clock)
                allDirty = true
            }
            const a0 = Math.floor(bounds[0] / TILE_MM)
            const a1 = Math.floor(bounds[2] / TILE_MM)
            const b0 = Math.floor(bounds[1] / TILE_MM)
            const b1 = Math.floor(bounds[3] / TILE_MM)
            // a zoomed-out pane sows thinner, so the last rows are not left bare
            const limit = Math.floor((MAX_DROPS * 0.5) / Math.max(1, (a1 - a0 + 1) * (b1 - b0 + 1)))
            let added = false
            for (let j = b0; j <= b1; j++) {
                for (let i = a0; i <= a1; i++) {
                    const k = (i + 2048) * 4096 + (j + 2048)
                    if (sown.has(k)) continue
                    sown.add(k)
                    W.sow(i, j, P, T, floorMm, limit)
                    added = true
                }
            }
            if (added) {
                allDirty = true
                W.rebuildGrid()
            }
        }

        const kernelPad = (rad: number) => {
            // the roundest a drop can vary to, which reaches the furthest
            const n = flat * 0.72
            const hc = Math.max((rad * ppm * tanHalf) / n, 1e-3)
            return rad * Math.pow(1 + thresh / hc, 0.5 / n)
        }

        const worldBox = (out: Float32Array, o: number, x0: number, y0: number, x1: number, y1: number) => {
            let a = 1e9
            let b = -1e9
            let c = 1e9
            let d = -1e9
            for (let q = 0; q < 4; q++) {
                const wx = q & 1 ? x1 : x0
                const wy = q & 2 ? y1 : y0
                const ww = M[2] * wx + M[5] * wy + M[8]
                const sx = (M[0] * wx + M[3] * wy + M[6]) / ww
                const sy = (M[1] * wx + M[4] * wy + M[7]) / ww
                a = Math.min(a, sx)
                b = Math.max(b, sx)
                c = Math.min(c, sy)
                d = Math.max(d, sy)
            }
            out[o] = a - 2
            out[o + 1] = c - 2
            out[o + 2] = b + 2
            out[o + 3] = d + 2
        }

        const dropPad = (i: number) => {
            const rd = W.r[i] * Math.max(0.3, W.grow[i])
            const e = Math.hypot(W.ex[i], W.ey[i])
            return kernelPad(rd) * (1 + e * 1.4) + rd * W.irr[i] * 0.7 + Math.min(0.12, rd * 0.3)
        }

        const dropBox = (i: number) => {
            const pad = dropPad(i)
            const ax = W.x[i]
            const ay = W.y[i]
            const bx = ax + W.tx[i]
            const by = ay + W.ty[i]
            worldBox(W.box, i * 4, Math.min(ax, bx) - pad, Math.min(ay, by) - pad, Math.max(ax, bx) + pad, Math.max(ay, by) + pad)
        }

        const nodeR = (k: number) => W.nr[k] * W.nTaper[k]
        const nodePad = (rad: number) => kernelPad(rad) + Math.min(1.0, rad * 0.8) + Math.min(0.1, rad * 0.15) + 0.04

        const nodeBox = (k: number) => {
            const p = W.prevOf(k)
            const rb = nodeR(k)
            const ra = p >= 0 ? nodeR(p) : rb
            const pad = nodePad(Math.max(ra, rb))
            const ax = p >= 0 ? W.nx[p] : W.nx[k]
            const ay = p >= 0 ? W.ny[p] : W.ny[k]
            worldBox(W.nBox, k * 4, Math.min(ax, W.nx[k]) - pad, Math.min(ay, W.ny[k]) - pad, Math.max(ax, W.nx[k]) + pad, Math.max(ay, W.ny[k]) + pad)
        }

        const markBox = (b: Float32Array, o: number) => {
            const x0 = Math.max(0, Math.floor(b[o] / DIRTY_TILE))
            const x1 = Math.min(tw - 1, Math.floor(b[o + 2] / DIRTY_TILE))
            const y0 = Math.max(0, Math.floor((bufH - b[o + 3]) / DIRTY_TILE))
            const y1 = Math.min(th - 1, Math.floor((bufH - b[o + 1]) / DIRTY_TILE))
            if (x1 < x0 || y1 < y0) return
            for (let y = y0; y <= y1; y++) {
                const row = y * tw
                for (let x = x0; x <= x1; x++) tiles[row + x] = 1
            }
            anyDirty = true
        }

        const writeDrop = (o: number, i: number) => {
            const rd = W.r[i] * W.grow[i] * (1 - 0.16 * Math.min(1, Math.hypot(W.vx[i], W.vy[i]) / 220))
            const e = W.ex[i]
            const f = W.ey[i]
            scratch[o] = W.x[i]
            scratch[o + 1] = W.y[i]
            scratch[o + 2] = W.x[i] + W.tx[i]
            scratch[o + 3] = W.y[i] + W.ty[i]
            scratch[o + 4] = Math.max(0.01, rd)
            // a tail narrows only once it is long enough to, or it steps across the head
            const taper = Math.min(1, Math.hypot(W.tx[i], W.ty[i]) / (2 * rd))
            scratch[o + 5] = Math.max(0.01, rd * (1 - (1 - W.tipK[i]) * taper * taper))
            scratch[o + 6] = W.seed[i]
            scratch[o + 7] = W.irr[i]
            scratch[o + 8] = e
            scratch[o + 9] = f
            scratch[o + 10] = dropPad(i)
            scratch[o + 11] = 0
        }

        const writeNode = (o: number, k: number) => {
            const p = W.prevOf(k)
            const rb = nodeR(k)
            const ra = p >= 0 ? nodeR(p) : rb
            scratch[o] = p >= 0 ? W.nx[p] : W.nx[k]
            scratch[o + 1] = p >= 0 ? W.ny[p] : W.ny[k]
            scratch[o + 2] = W.nx[k]
            scratch[o + 3] = W.ny[k]
            scratch[o + 4] = Math.max(0.01, ra)
            scratch[o + 5] = Math.max(0.01, rb)
            scratch[o + 6] = 0
            scratch[o + 7] = 0
            scratch[o + 8] = 0
            scratch[o + 9] = 0
            scratch[o + 10] = nodePad(Math.max(ra, rb))
            scratch[o + 11] = 1
        }

        /** Merges the dirty tiles into rectangles, in buffer px, bottom-left origin. */
        const collectRects = () => {
            rectN = 0
            if (allDirty) {
                rects[0] = 0
                rects[1] = 0
                rects[2] = bufW
                rects[3] = bufH
                rectN = 1
                return
            }
            let overflow = false
            for (let y = 0; y < th && !overflow; y++) {
                const row = y * tw
                let x = 0
                while (x < tw) {
                    if (!tiles[row + x]) {
                        x++
                        continue
                    }
                    const start = x
                    while (x < tw && tiles[row + x]) x++
                    // extend a rectangle that ended on the row below with the same span
                    let joined = false
                    for (let r = 0; r < rectN; r++) {
                        const o = r * 4
                        if (rects[o] === start * DIRTY_TILE && rects[o + 2] === x * DIRTY_TILE && rects[o + 3] === y * DIRTY_TILE) {
                            rects[o + 3] = (y + 1) * DIRTY_TILE
                            joined = true
                            break
                        }
                    }
                    if (joined) continue
                    if (rectN >= MAX_RECTS) {
                        overflow = true
                        break
                    }
                    const o = rectN * 4
                    rects[o] = start * DIRTY_TILE
                    rects[o + 1] = y * DIRTY_TILE
                    rects[o + 2] = x * DIRTY_TILE
                    rects[o + 3] = (y + 1) * DIRTY_TILE
                    rectN++
                }
            }
            if (overflow) {
                let x0 = tw
                let x1 = 0
                let y0 = th
                let y1 = 0
                for (let y = 0; y < th; y++) {
                    for (let x = 0; x < tw; x++) {
                        if (!tiles[y * tw + x]) continue
                        x0 = Math.min(x0, x)
                        x1 = Math.max(x1, x + 1)
                        y0 = Math.min(y0, y)
                        y1 = Math.max(y1, y + 1)
                    }
                }
                rects[0] = x0 * DIRTY_TILE
                rects[1] = y0 * DIRTY_TILE
                rects[2] = x1 * DIRTY_TILE
                rects[3] = y1 * DIRTY_TILE
                rectN = 1
            }
        }

        const uploadComp = (g: GLState, img: boolean) => {
            const P = propsRef.current
            const A = P.advanced
            const gl = g.gl
            const u = img ? g.uCompImg : g.uComp
            const pr = img ? g.compImg : g.comp
            const key = JSON.stringify([img, P.background, P.lightColor, A, P.scene.offsetY, P.scene.blur, bufW, bufH, imgW, imgH, shown])
            if (key === compKey) return
            compKey = key
            const S = Math.min(bufH, bufW / REF_ASPECT)
            const bg = parseColor(P.background, [0, 0, 0])
            const li = parseColor(P.lightColor, [1, 1, 1])
            gl.useProgram(pr)
            gl.uniform1i(u.uH, 0)
            gl.uniform1i(u.uEnv, 1)
            gl.uniform1i(u.uGrain, 2)
            gl.uniform1i(u.uImg, 3)
            gl.uniform2f(u.uCenter, bufW / 2, bufH / 2)
            gl.uniform1f(u.uUnit, S)
            gl.uniform1f(u.uT, thresh)
            gl.uniform3f(u.uBg, bg[0], bg[1], bg[2])
            gl.uniform3f(u.uLight, li[0], li[1], li[2])
            gl.uniform1f(u.uIor, A.refraction)
            gl.uniform1f(u.uDist, A.lensDistance)
            gl.uniform4f(u.uSky, A.skyHeight, Math.max(1e-3, A.skySoftness), A.skyCentre, Math.max(1e-3, A.skyWidth))
            gl.uniform1f(u.uSkyDrift, A.skyDrift)
            gl.uniform1f(u.uSkyLevel, A.skyLevel)
            gl.uniform3f(u.uGround, A.groundStart, Math.max(1e-3, A.groundSoftness), A.groundDark)
            gl.uniform1f(u.uDim, A.dropDim)
            // grain is sized in CSS px whatever the buffer is
            gl.uniform2f(u.uGrainK, 1 / (bufScale * NOISE_SIZE * 0.8), A.grain)
            if (img) {
                // cover the frame on the picture's own aspect; the offset picks the band
                const fa = bufW / bufH
                const ia = imgW / Math.max(1, imgH)
                const sx = fa > ia ? 1 : fa / ia
                const sy = fa > ia ? ia / fa : 1
                const shift = (P.scene.offsetY / 250) * 0.5 * (1 - sy)
                gl.uniform4f(u.uImgMap, (S / bufW) * sx, (-S / bufH) * sy, 0.5, 0.5 - shift)
                gl.uniform1f(u.uImgLod, (P.scene.blur / 10) * 5.5)
            }
        }

        const paint = () => {
            if (!G || lost) return
            ensureTargets()
            updateView()
            sowView()
            const gl = G.gl
            const P = propsRef.current
            const useImg = imgReady && !!imgSrc
            if (allDirty) {
                for (let i = 0; i < MAX_DROPS; i++) if (W.state[i] !== DEAD) dropBox(i)
                for (let k = 0; k < MAX_NODES; k++) if (W.nAlive[k]) nodeBox(k)
            }
            collectRects()
            if (rectN === 0) return

            // who touches what: a drop only has to be redrawn where its tile went stale
            // ponytail: scans every drop per rectangle, under 1 ms at the pool sizes here; a grid query if the pools grow
            let n = 0
            for (let r = 0; r < rectN; r++) {
                const o = r * 4
                const x0 = rects[o]
                const y0 = bufH - rects[o + 3]
                const x1 = rects[o + 2]
                const y1 = bufH - rects[o + 1]
                const start = n
                for (let i = 0; i < MAX_DROPS && n < MAX_PRIMS; i++) {
                    if (W.state[i] === DEAD) continue
                    const b = i * 4
                    if (W.box[b] > x1 || W.box[b + 2] < x0 || W.box[b + 1] > y1 || W.box[b + 3] < y0) continue
                    writeDrop(n * PRIM_FLOATS, i)
                    n++
                }
                for (let k = 0; k < MAX_NODES && n < MAX_PRIMS; k++) {
                    if (!W.nAlive[k]) continue
                    const b = k * 4
                    if (W.nBox[b] > x1 || W.nBox[b + 2] < x0 || W.nBox[b + 1] > y1 || W.nBox[b + 3] < y0) continue
                    writeNode(n * PRIM_FLOATS, k)
                    n++
                }
                rectCounts[r] = n - start
            }

            gl.disable(gl.DEPTH_TEST)
            gl.disable(gl.CULL_FACE)
            gl.bindVertexArray(G.vao)
            gl.viewport(0, 0, bufW, bufH)

            // 1. the height field
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, G.data)
            if (n > 0) {
                const texels = n * 3
                const rows = Math.ceil(texels / DATA_W)
                const view = scratch.subarray(0, rows * DATA_W * 4)
                // RGBA texels: three per primitive, packed into the row width
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, DATA_W, rows, gl.RGBA, gl.FLOAT, view)
            }
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, G.noise)
            gl.bindFramebuffer(gl.FRAMEBUFFER, G.hFbo)
            gl.useProgram(G.prim)
            const up = G.uPrim
            gl.uniform1i(up.uData, 0)
            gl.uniform1i(up.uNoise, 1)
            gl.uniformMatrix3fv(up.uM, false, M)
            gl.uniform2f(up.uView, bufW, bufH)
            gl.uniform1f(up.uPpm, ppm)
            gl.uniform1f(up.uT, thresh)
            gl.uniform1f(up.uTan, tanHalf)
            gl.uniform1f(up.uRelief, P.advanced.relief)
            gl.uniform1f(up.uFlat, flat)
            gl.enable(gl.SCISSOR_TEST)
            gl.enable(gl.BLEND)
            gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE)
            gl.blendEquationSeparate(gl.FUNC_ADD, gl.MAX)
            gl.clearColor(0, 0, 0, 0)
            let first = 0
            for (let r = 0; r < rectN; r++) {
                const o = r * 4
                gl.scissor(rects[o], rects[o + 1], rects[o + 2] - rects[o], rects[o + 3] - rects[o + 1])
                gl.clear(gl.COLOR_BUFFER_BIT)
                if (rectCounts[r] > 0) gl.drawArrays(gl.TRIANGLES, first * 6, rectCounts[r] * 6)
                first += rectCounts[r]
            }
            gl.disable(gl.BLEND)
            gl.blendEquation(gl.FUNC_ADD)

            // 2. the picture through it
            uploadComp(G, useImg)
            gl.bindFramebuffer(gl.FRAMEBUFFER, G.cFbo)
            gl.useProgram(useImg ? G.compImg : G.comp)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, G.hTex)
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, G.env)
            gl.activeTexture(gl.TEXTURE2)
            gl.bindTexture(gl.TEXTURE_2D, G.grain)
            gl.activeTexture(gl.TEXTURE3)
            gl.bindTexture(gl.TEXTURE_2D, G.img)
            for (let r = 0; r < rectN; r++) {
                const o = r * 4
                gl.scissor(rects[o], rects[o + 1], rects[o + 2] - rects[o], rects[o + 3] - rects[o + 1])
                gl.drawArrays(gl.TRIANGLES, 0, 3)
            }
            gl.disable(gl.SCISSOR_TEST)

            // 3. onto the page: the drawing buffer does not survive a present
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, G.cFbo)
            gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null)
            gl.blitFramebuffer(0, 0, bufW, bufH, 0, 0, bufW, bufH, gl.COLOR_BUFFER_BIT, gl.NEAREST)
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null)
            gl.bindVertexArray(null)

            tiles.fill(0)
            anyDirty = false
            allDirty = false
            drawnFrames++
        }

        const world = [0, 0]

        /** What the pointer's drop can carry. 5 is half again a drop's own limit, which one hover gathers. */
        const holdLimit = () => T.vCrit * (0.7 + clamp(propsRef.current.gather.capacity, 0, 10) * 0.18)

        /** One step of the pointer: its place on the glass, what it holds, what it pulls. */
        const updatePointer = (now: number, frameDt: number) => {
            const P = propsRef.current
            const g = P.gather
            const ptr = W.ptr
            if (ptrMoved) {
                rect = root.getBoundingClientRect()
                ptrMoved = false
            }
            const active = ptrIn && g.hover && !!rect && rect.width > 0
            if (active && rect) {
                const u = (ptrX - rect.left) / rect.width
                const v = (ptrY - rect.top) / rect.height
                toWorld(u * bufW, v * bufH, world)
                ptr.x = world[0]
                ptr.y = world[1]
            }
            ptr.on = active
            // the pull spreads out from the pointer rather than arriving all at once
            const reachWant = (g.reach / 10) * 48
            if (active) reachNow += (reachWant - reachNow) * (1 - Math.exp(-frameDt / 0.8))
            else reachNow = reachWant * 0.25
            ptr.reach = reachNow
            ptr.pull = g.pull / 5
            let quiet = !active || reachNow > reachWant * 0.98
            const vCap = holdLimit()
            if (active) {
                // everything in reach comes unstuck
                const reach2 = ptr.reach * ptr.reach
                for (let i = 0; i < MAX_DROPS; i++) {
                    if (W.state[i] !== PINNED || now < W.free[i]) continue
                    const dx = W.x[i] - ptr.x
                    const dy = W.y[i] - ptr.y
                    const sh = W.reachShare(i)
                    if (dx * dx + dy * dy < reach2 * sh * sh) {
                        W.wake(i)
                        quiet = false
                    }
                }
                // rivulets close by break up into beads the pointer can pull
                const near = ptr.reach * 0.4
                for (let k = 0; k < MAX_NODES; k++) {
                    if (!W.nAlive[k] || W.nDie[k] <= now || now - W.nBorn[k] < 2.5) continue
                    const dx = W.nx[k] - ptr.x
                    const dy = W.ny[k] - ptr.y
                    if (dx * dx + dy * dy < near * near) {
                        const die = now + 0.3 * (Math.sqrt(dx * dx + dy * dy) / near)
                        if (die < W.nDie[k]) {
                            W.nDie[k] = die
                            if (die < W.nextDie) W.nextDie = die
                            if (!W.nBead[k] && W.random() < 0.3) W.nBead[k] = W.nr[k] * 0.6
                            quiet = false
                        }
                    }
                }
                if (W.hold < 0 || W.state[W.hold] !== MOVING) {
                    W.hold = -1
                    let best = -1
                    let bd = 1e9
                    for (let a = 0; a < W.actN; a++) {
                        const i = W.act[a]
                        if (W.state[i] !== MOVING || now < W.free[i]) continue
                        const d = Math.hypot(W.x[i] - ptr.x, W.y[i] - ptr.y) - W.r[i]
                        if (d < bd) {
                            bd = d
                            best = i
                        }
                    }
                    if (best >= 0 && bd < 1.6) W.hold = best
                }
            } else if (W.hold >= 0) {
                // let go: it stays if the glass can hold it, and runs if not
                W.free[W.hold] = now + 0.4
                W.hold = -1
            }
            const h = W.hold
            if (h >= 0) {
                if (W.V[h] >= vCap) {
                    // past what the contact line can carry: it pinches off and gravity has it
                    const rest = W.V[h] * 0.07
                    W.free[h] = now + 3
                    W.vy[h] += 60
                    W.setVolume(h, W.V[h] - rest, T)
                    W.hold = -1
                    const nr = Math.cbrt(rest / T.beta)
                    const q = W.spawn(ptr.x, ptr.y, nr, T, W.random(), 0.2)
                    if (q >= 0) {
                        W.wake(q)
                        W.hold = q
                    }
                }
            }
            return quiet
        }

        const stepHold = (dt: number) => {
            const h = W.hold
            if (h < 0) return
            const ptr = W.ptr
            const sag = W.r[h] * (W.V[h] / holdLimit()) * 0.55
            const wx = 58
            const tx = ptr.x + T.gx * sag
            const ty = ptr.y + T.gy * sag
            const ax = wx * wx * (tx - W.x[h]) - 2 * wx * W.vx[h]
            const ay = wx * wx * (ty - W.y[h]) - 2 * wx * W.vy[h]
            W.vx[h] += ax * dt
            W.vy[h] += ay * dt
        }

        /** Shape follows motion: a tail behind it, a rounder line, a settling rest. */
        const relax = (dt: number, now: number) => {
            let busy = false
            for (let a = W.actN - 1; a >= 0; a--) {
                const i = W.act[a]
                const st = W.state[i]
                if (st === DEAD) continue
                const sp = Math.hypot(W.vx[i], W.vy[i])
                const c = Math.min(1, sp / 220)
                let wx = W.restX[i]
                let wy = W.restY[i]
                let tip = W.tipK[i]
                if (sp > 4) {
                    const L = W.r[i] * (0.5 + 3.2 * c)
                    wx = (-W.vx[i] / sp) * L
                    wy = (-W.vy[i] / sp) * L
                    W.restX[i] = (-W.vx[i] / sp) * W.r[i] * 0.7
                    W.restY[i] = (-W.vy[i] / sp) * W.r[i] * 0.7
                    tip = 0.34
                }
                const k = 1 - Math.exp(-dt / 0.07)
                const dtx = wx - W.tx[i]
                const dty = wy - W.ty[i]
                W.tx[i] += dtx * k
                W.ty[i] += dty * k
                W.tipK[i] += (tip - W.tipK[i]) * k
                const irrWant = sp > 4 ? W.irrBase[i] * 0.12 : W.irrBase[i] * 0.75
                const dirr = irrWant - W.irr[i]
                W.irr[i] += dirr * (1 - Math.exp(-dt / 0.16))
                const changed =
                    st === MERGING ||
                    sp > 0.05 ||
                    W.grow[i] < 1 ||
                    W.ex[i] !== 0 ||
                    W.ey[i] !== 0 ||
                    W.evx[i] !== 0 ||
                    W.evy[i] !== 0 ||
                    Math.abs(dtx) + Math.abs(dty) >= 0.012 ||
                    Math.abs(dirr) >= 0.006
                if (changed) {
                    markBox(W.box, i * 4)
                    dropBox(i)
                    markBox(W.box, i * 4)
                    busy = true
                } else if (st === MOVING && i !== W.hold) {
                    // still in the pointer's reach: it stays ready to move, and costs nothing
                    const reach = W.ptr.reach * W.reachShare(i)
                    if (!(W.ptr.on && Math.hypot(W.x[i] - W.ptr.x, W.y[i] - W.ptr.y) < reach && now >= W.free[i])) {
                        W.tx[i] = wx
                        W.ty[i] = wy
                        W.state[i] = PINNED
                        W.inAct[i] = 0
                        W.act[a] = W.act[--W.actN]
                        // its last, exact shape
                        markBox(W.box, i * 4)
                        dropBox(i)
                        markBox(W.box, i * 4)
                    }
                }
                // off the glass, or a bad number: written so NaN falls in here too
                if (st !== MERGING && W.state[i] !== DEAD && !(W.x[i] > bounds[0] - 30 && W.x[i] < bounds[2] + 30 && W.y[i] > bounds[1] - 30 && W.y[i] < bounds[3] + 30)) {
                    if (W.hold === i) W.hold = -1
                    W.kill(i)
                }
            }
            return busy
        }

        /** Rivulets drain from the top: nodes shrink away and leave their beads. */
        const stepNodes = (dt: number, now: number) => {
            if (now < W.nextDie) return false
            let next = Infinity
            let busy = false
            for (let k = 0; k < MAX_NODES; k++) {
                if (!W.nAlive[k]) continue
                if (W.nDie[k] > now) {
                    if (W.nDie[k] < next) next = W.nDie[k]
                    continue
                }
                busy = true
                W.nTaper[k] -= dt / 0.3
                markBox(W.nBox, k * 4)
                if (W.nTaper[k] <= 0.02) {
                    if (W.nBead[k] > 0) {
                        const b = W.nBead[k]
                        const i = W.spawn(W.nx[k], W.ny[k], b, T, W.random(), 0.35)
                        if (i >= 0) {
                            const L = b * (0.4 + 1.6 * W.random())
                            W.setRest(i, 0, -L)
                            W.grow[i] = 0.7
                            W.wake(i)
                        }
                    }
                    W.freeNode(k)
                } else {
                    nodeBox(k)
                    markBox(W.nBox, k * 4)
                }
            }
            W.nextDie = busy ? now : next
            return busy
        }

        /** Drops landing per second on the glass in view. */
        const rainRate = () => (reduced() ? 0 : Math.pow(propsRef.current.rain / 10, 1.6) * 60 * (((bounds[2] - bounds[0]) * (bounds[3] - bounds[1])) / 10000))

        /** New rain: lands as a new bead, or feeds whatever it hits. */
        const stepRain = (dt: number) => {
            const P = propsRef.current
            const rate = rainRate()
            if (rate <= 0) return
            rainAcc += dt * rate
            // a window's big runs start above what you can see, where rain has collected
            runAcc += dt * (P.rain / 10) * 0.2
            if (runAcc >= 1) {
                runAcc -= 1
                const hw = (bounds[2] - bounds[0]) / 2
                const hh = (bounds[3] - bounds[1]) / 2
                const reach = Math.abs(T.gx) * hw + Math.abs(T.gy) * hh + 6
                const span = Math.abs(T.gy) * hw + Math.abs(T.gx) * hh
                const side = (W.random() - 0.5) * 2 * span
                const px = (bounds[0] + bounds[2]) / 2 - T.gx * reach + T.gy * side
                const py = (bounds[1] + bounds[3]) / 2 - T.gy * reach - T.gx * side
                const v = T.vCrit * (1.08 + 0.6 * W.random())
                const i = W.spawn(px, py, Math.cbrt(v / T.beta), T, W.random(), 0.1)
                if (i >= 0) {
                    W.vx[i] = T.gx * 30
                    W.vy[i] = T.gy * 30
                    W.wake(i)
                }
            }
            let guard = 6
            while (rainAcc >= 1 && guard-- > 0) {
                rainAcc -= 1
                const px = bounds[0] + W.random() * (bounds[2] - bounds[0])
                const py = bounds[1] + W.random() * (bounds[3] - bounds[1])
                const u = W.random()
                const rad = 0.22 + 0.85 * u * u * u
                const reach = rad + W.maxExt() + 0.5
                let hit = -1
                const cx0 = W.cellOf(px - reach)
                const cx1 = W.cellOf(px + reach)
                const cy0 = W.cellOf(py - reach)
                const cy1 = W.cellOf(py + reach)
                for (let cy = cy0; cy <= cy1 && hit < 0; cy++) {
                    for (let cx = cx0; cx <= cx1 && hit < 0; cx++) {
                        let j = W.cells[(cx & (GRID - 1)) + (cy & (GRID - 1)) * GRID]
                        while (j >= 0) {
                            if ((W.state[j] === PINNED || W.state[j] === MOVING) && W.gapTo(px, py, j) < rad * 0.7) {
                                hit = j
                                break
                            }
                            j = W.nextInCell[j]
                        }
                    }
                }
                if (hit >= 0) {
                    W.setVolume(hit, W.V[hit] + T.beta * rad * rad * rad, T)
                    W.evx[hit] += (W.random() - 0.5) * 1.2
                    W.evy[hit] += (W.random() - 0.5) * 1.2
                    W.wake(hit)
                } else if (W.live < MAX_DROPS * 0.8) {
                    const i = W.spawn(px, py, rad, T, W.random(), 0.2 + 0.4 * W.random())
                    if (i >= 0) {
                        W.grow[i] = 0.45
                        W.evx[i] = (W.random() - 0.5) * 2.4
                        W.evy[i] = (W.random() - 0.5) * 2.4
                        const L = rad * 0.5 * W.random()
                        W.setRest(i, 0, -L)
                        W.wake(i)
                    }
                }
            }
        }

        const doKnock = (now: number) => {
            const P = propsRef.current
            const ptr = W.ptr
            const power = clamp(P.knock / 10, 0, 1)
            if (power <= 0) return
            const reach = Math.max(14, ((P.gather.reach / 10) * 60 + 8) * 1.4)
            const K = W.knock
            K.t = now
            K.x = ptr.x
            K.y = ptr.y
            K.reach = reach
            K.power = Math.min(0.92, power * 1.6)
            for (let i = 0; i < MAX_DROPS; i++) {
                if (W.state[i] === DEAD) continue
                const dx = W.x[i] - ptr.x
                const dy = W.y[i] - ptr.y
                const d = Math.sqrt(dx * dx + dy * dy)
                if (d > reach) continue
                const w = 1 - d / reach
                const s = (d > 1e-3 ? 1 / d : 0) * w * power * 7
                W.evx[i] += dx * s
                W.evy[i] += dy * s
                W.wake(i)
            }
        }

        const worldPointerOnce = () => {
            rect = root.getBoundingClientRect()
            if (rect.width <= 0) return
            toWorld(((ptrX - rect.left) / rect.width) * bufW, ((ptrY - rect.top) / rect.height) * bufH, world)
            W.ptr.x = world[0]
            W.ptr.y = world[1]
        }

        const tick = (now: number) => {
            raf = 0
            // an unmeasured frame has no scale to sow at; the ResizeObserver wakes us
            if (!G || !visible || !pageVisible || lost || cssW <= 0 || cssH <= 0) {
                running = false
                return
            }
            if (lastTick) {
                const g = now - lastTick
                if (g > 0 && g < 250) {
                    gaps.push(g)
                    if (gaps.length > 15) gaps.shift()
                }
            }
            lastTick = now
            const period = gaps.length ? [...gaps].sort((a, b) => a - b)[gaps.length >> 1] : 16.7
            const x = 16.7 / period
            if (x <= divisor - 1 - 0.05 || x > divisor + 0.12) divisor = Math.max(1, Math.ceil(x - 0.08))
            const elapsed = lastDraw ? now - lastDraw : 1e9
            if (elapsed < (divisor - 0.5) * period) {
                raf = requestAnimationFrame(tick)
                return
            }
            const dt = lastDraw ? Math.min(0.05, elapsed / 1000) : 1 / 60
            const gapMs = lastDraw ? elapsed : 0
            lastDraw = now
            clock += dt

            ensureTargets()
            updateView()
            sowView()
            W.rebuildGrid()

            let quiet = updatePointer(clock, dt)
            if (wantKnock) {
                wantKnock = false
                worldPointerOnce()
                doKnock(clock)
                if (W.hold >= 0) {
                    W.free[W.hold] = clock + 0.8
                    W.hold = -1
                }
            }
            if (wantDrop) {
                wantDrop = false
                if (W.hold >= 0) {
                    W.free[W.hold] = clock + 0.4
                    W.hold = -1
                }
            }
            stepRain(dt)
            subAcc += dt
            let steps = 0
            while (subAcc >= SUBSTEP && steps < MAX_SUBSTEPS) {
                subAcc -= SUBSTEP
                steps++
                stepHold(SUBSTEP)
                W.stepDrops(SUBSTEP, clock, T)
            }
            if (subAcc > SUBSTEP) subAcc = 0
            const moving = relax(dt, clock)
            const nodes = stepNodes(dt, clock)
            for (let n = 0; n < W.goneN; n++) markBox(W.box, W.gone[n] * 4)
            W.goneN = 0
            for (let n = 0; n < W.freshN; n++) {
                nodeBox(W.fresh[n])
                markBox(W.nBox, W.fresh[n] * 4)
            }
            W.freshN = 0
            quiet = quiet && !moving && !nodes

            if (propsRef.current !== lastProps) {
                lastProps = propsRef.current
                const key = JSON.stringify(lastProps)
                if (key !== lastKey) {
                    lastKey = key
                    allDirty = true
                }
            }
            if (anyDirty || allDirty) {
                const target = Math.min(divisor * period, 33.4)
                if (gapMs > 0 && !quiet) {
                    if (gapMs > target * 1.4) slowMs += gapMs
                    else slowMs = Math.max(0, slowMs - gapMs * 0.5)
                    if (gapMs < target * 1.15) goodMs += gapMs
                    else goodMs = 0
                    if (probeAt && now - probeAt < 1500 && slowMs > 300) {
                        banUntil[qi - 1 >= 0 ? qi - 1 : 0] = now + 30000
                        qi = Math.min(LADDER.length - 1, qi + 1)
                        probeAt = 0
                        slowMs = 0
                    } else if (slowMs > 500 && qi < LADDER.length - 1) {
                        qi++
                        slowMs = 0
                        goodMs = 0
                    } else if (goodMs > 4000 && qi > 0 && now > banUntil[qi - 1]) {
                        qi--
                        goodMs = 0
                        probeAt = now
                    }
                }
                paint()
                if (drawnFrames % 30 === 0 && cssW > 0) {
                    const sh = root.getBoundingClientRect().width / cssW
                    if (Math.abs(sh - shown) / shown > 0.05) {
                        shown = sh
                        targetsDirty = true
                        compKey = ""
                    }
                }
            }
            if (!quiet || anyDirty || allDirty || targetsDirty || (W.hold >= 0 && Math.hypot(W.vx[W.hold], W.vy[W.hold]) > 0.2)) {
                raf = requestAnimationFrame(tick)
                return
            }
            // nothing is moving: sleep until the next drop lands or a rivulet lets go
            let wait = W.nextDie === Infinity ? Infinity : (W.nextDie - clock) * 1000
            const rate = rainRate()
            if (rate > 0) wait = Math.min(wait, (1000 * Math.max(0, 1 - rainAcc)) / rate)
            running = false
            sleepAt = now
            if (wait !== Infinity) {
                idleTimer = window.setTimeout(wakeTimed, Math.max(4, wait))
            }
        }

        let lastKey = ""
        let lastProps: Merged | null = null

        const start = () => {
            if (!running && visible && pageVisible && !lost) {
                running = true
                if (sleepAt) {
                    clock += Math.max(0, (performance.now() - sleepAt) / 1000)
                    sleepAt = 0
                }
                lastTick = 0
                lastDraw = 0
                raf = requestAnimationFrame(tick)
            }
        }
        const wakeTimed = () => {
            idleTimer = 0
            start()
        }
        const wake = () => {
            if (idleTimer) {
                clearTimeout(idleTimer)
                idleTimer = 0
            }
            start()
        }
        wakeRef.current = wake

        const ro = new ResizeObserver((entries) => {
            for (const en of entries) {
                cssW = en.contentRect.width
                cssH = en.contentRect.height
            }
            const r = root.getBoundingClientRect()
            if (cssW > 0) shown = r.width / cssW
            targetsDirty = true
            wake()
        })
        ro.observe(root)
        const io = new IntersectionObserver((entries) => {
            for (const en of entries) visible = en.isIntersecting
            if (visible) wake()
        })
        io.observe(root)
        const onVis = () => {
            pageVisible = !document.hidden
            if (pageVisible) wake()
        }
        document.addEventListener("visibilitychange", onVis)
        const onScroll = () => {
            if (ptrIn) ptrMoved = true
        }
        window.addEventListener("scroll", onScroll, { passive: true })

        const onMove = (ev: PointerEvent) => {
            if (ev.clientX === ptrX && ev.clientY === ptrY && ptrIn) return
            ptrIn = true
            ptrX = ev.clientX
            ptrY = ev.clientY
            ptrMoved = true
            wake()
        }
        const onLeave = () => {
            ptrIn = false
            wake()
        }
        const onDown = (ev: PointerEvent) => {
            ptrX = ev.clientX
            ptrY = ev.clientY
            ptrIn = true
            ptrMoved = true
            wantKnock = true
            wake()
        }
        const onUp = (ev: PointerEvent) => {
            if (ev.pointerType !== "mouse") {
                ptrIn = false
                wantDrop = true
                wake()
            }
        }
        root.addEventListener("pointermove", onMove)
        root.addEventListener("pointerleave", onLeave)
        root.addEventListener("pointerdown", onDown)
        root.addEventListener("pointerup", onUp)
        root.addEventListener("pointercancel", onUp)

        const onLost = (ev: Event) => {
            ev.preventDefault()
            lost = true
            if (raf) cancelAnimationFrame(raf)
            raf = 0
            running = false
        }
        const onRestored = () => {
            G = initGL(canvas)
            lost = false
            bufW = bufH = 0
            targetsDirty = true
            compKey = ""
            imgSrc = ""
            imgReady = false
            allDirty = true
            loadImage()
            wake()
        }
        canvas.addEventListener("webglcontextlost", onLost)
        canvas.addEventListener("webglcontextrestored", onRestored)

        // The picture behind the glass, loaded off the render path.
        let cancelled = false
        const loadImage = () => {
            const want = imageSrc(propsRef.current.scene.image)
            if (want === imgSrc) return
            imgSrc = want
            imgReady = false
            allDirty = true
            if (!want) return
            const img = new window.Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
                if (cancelled || want !== imgSrc || !G) return
                const gl = G.gl
                gl.activeTexture(gl.TEXTURE3)
                gl.bindTexture(gl.TEXTURE_2D, G.img)
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, img)
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
                gl.generateMipmap(gl.TEXTURE_2D)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
                imgW = img.naturalWidth
                imgH = img.naturalHeight
                imgReady = true
                compKey = ""
                allDirty = true
                wake()
            }
            // a picture that will not load leaves the street in place
            img.onerror = () => {}
            img.src = want
        }
        wakeRef.current = () => {
            loadImage()
            wake()
        }
        loadImage()

        wake()

        return () => {
            cancelled = true
            wakeRef.current = null
            if (raf) cancelAnimationFrame(raf)
            if (idleTimer) clearTimeout(idleTimer)
            ro.disconnect()
            io.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            window.removeEventListener("scroll", onScroll)
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerleave", onLeave)
            root.removeEventListener("pointerdown", onDown)
            root.removeEventListener("pointerup", onUp)
            root.removeEventListener("pointercancel", onUp)
            canvas.removeEventListener("webglcontextlost", onLost)
            canvas.removeEventListener("webglcontextrestored", onRestored)
            if (G && !G.gl.isContextLost()) {
                const gl = G.gl
                gl.deleteVertexArray(G.vao)
                gl.deleteProgram(G.prim)
                gl.deleteProgram(G.comp)
                gl.deleteProgram(G.compImg)
                for (const t of [G.data, G.noise, G.grain, G.env, G.img, G.hTex, G.cTex]) gl.deleteTexture(t)
                gl.deleteFramebuffer(G.hFbo)
                gl.deleteFramebuffer(G.cFbo)
            }
            G = null
        }
    }, [])

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                aspectRatio: `${REF_W} / ${REF_H}`,
                overflow: "hidden",
                background,
                touchAction: "pan-y",
                ...style,
            }}
        >
            <canvas ref={glRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", pointerEvents: "none" }} />
        </div>
    )
}

/* ---------------------------------------------------------------- */
/*  Property controls                                                */
/* ---------------------------------------------------------------- */

// Control order arranged in the builder.
