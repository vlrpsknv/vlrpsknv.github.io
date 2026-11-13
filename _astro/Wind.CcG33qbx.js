import{n as e}from"./rolldown-runtime.WkwZ5CU-.js";import{t}from"./react.CmU_e8vp.js";import{t as n}from"./jsx-runtime.C2aMnSBe.js";var r=e(t(),1),i=16e6;function a({deviceWidth:e,deviceHeight:t,scale:n}){if(!(e>0&&t>0&&n>0))return null;let r=Math.max(5,Math.round(7*n)),a=r*2,o=Math.ceil(e/r),s=Math.ceil(t/a);if(o<24||s<8)return null;let c=o*r*s*a/i;if(c>1){let e=Math.sqrt(c);o=Math.floor(o/e),s=Math.floor(s/e)}return{cellWidth:r,cellHeight:a,columns:o,rows:s,left:Math.floor((e-o*r)/2),top:Math.floor((t-s*a)/2),scale:n}}var o=3.6,s=2.4,c=22,l=.25,u=80,d=900,f=1,p=-1.2;function m(e,t,n){let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)}function h(){let e=[],t=[],n=0,r=null,i=null,a=0,h={now:0,tapCount:0,taps:new Float32Array(24),trailCount:0,trail:new Float32Array(128)};return{move(e,n,o){if(!r||!i||o-r.at>l)return r={x:e,y:n,at:o},i={x:e,y:n},a=0,!1;let s=Math.max(o-r.at,1/240);a+=(Math.hypot(e-r.x,n-r.y)/s-a)*Math.min(1,s/.08),r={x:e,y:n,at:o};let f=Math.hypot(e-i.x,n-i.y);if(f<c)return!1;let p=m(u,d,a);if(p<.04)return i={x:e,y:n},!1;let h=Math.floor(f/c),g=i;for(let r=1;r<=h;r+=1){let i=r*c/f;t.push({x:g.x+(e-g.x)*i,y:g.y+(n-g.y)*i,at:o,heat:p})}let _=h*c/f;return i={x:g.x+(e-g.x)*_,y:g.y+(n-g.y)*_},t.length>32&&(t=t.slice(-32)),!0},tap(t,r,i){n+=1;let a=n%3==0;return e=[...e.slice(-5),{x:t,y:r,at:i,force:a?p:f}],a?`heart`:`ring`},leave(){r=null,i=null},frame(n){e=e.filter(e=>n-e.at<o),t=t.filter(e=>n-e.at<s),h.now=n,h.tapCount=e.length,e.forEach((e,t)=>h.taps.set([e.x,e.y,e.at,e.force],t*4));let r=0;for(let e of t){let t=Math.max(0,n-e.at),i=e.heat*(1-Math.exp(-t/.06))*Math.exp(-t/.7);if(i<.003)continue;let a=46+36*t;h.trail.set([e.x,e.y,i,1/(a*a)],r*4),r+=1}return h.trailCount=r,h},busy(n){return e.some(e=>n-e.at<3.6)||t.some(e=>n-e.at<2.4)},rippling(t){return e.some(e=>t-e.at<o)}}}var g=`1.1`,_=`#version 300 es
void main() {
  // Triangle (0,0)-(2,0)-(0,2) in clip-space halves covers the whole frame with one shape.
  vec2 corner = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}
`,v=`
// lowbias32 integer hash (public domain): no sine hashes, which band on low-precision mobile GPUs.
uint mixBits(uint x) {
  x ^= x >> 16;
  x *= 0x7feb352du;
  x ^= x >> 15;
  x *= 0x846ca68bu;
  x ^= x >> 16;
  return x;
}
float unit(uint h) { return float(h >> 8) * (1.0 / 16777216.0); }
`,y=`#version 300 es
precision highp float;
precision highp int;

uniform int u_rows;
// Centre of cell (0, 0) and the grid step, in the container's CSS pixels.
uniform vec2 u_origin;
uniform vec2 u_cell;
// Wind clock (stops when the wind has died down) and touch clock (always runs), s.
uniform float u_clock;
uniform float u_now;
// The wind arrives over the first seconds and leaves when it dies down: 0..1.
uniform float u_reveal;
// Wind heading (unit vector, y down), speed (CSS px/s), gust size along and across, and the
// length of the long swell.
uniform vec2 u_heading;
uniform float u_speed;
uniform vec2 u_gust;
uniform float u_span;
// Calm zone behind content: centre (xy) and half sizes (zw), CSS px.
uniform vec4 u_calm;
uniform int u_tapCount;
uniform vec4 u_taps[6];
uniform int u_trailCount;
uniform vec4 u_trail[32];

out vec4 o;

const float TAU = 6.2831853;
// Threshold at which a cell lights up, and the softness of a gust's edge.
const float LEVEL = 0.16;
const float BAND = 0.2;
// How much light is left behind the guidance text.
const float CALM_FLOOR = 0.14;

${v}

uniform uint u_seed;
// Gradient direction at a lattice node: a random point on the sphere.
vec3 gradientAt(ivec3 c, uint salt) {
  uint h = mixBits(uint(c.x) ^ mixBits(uint(c.y) ^ mixBits(uint(c.z) ^ salt ^ u_seed)));
  float a = unit(h) * 6.2831853;
  float z = unit(mixBits(h)) * 2.0 - 1.0;
  float r = sqrt(max(0.0, 1.0 - z * z));
  return vec3(r * cos(a), r * sin(a), z);
}
// Gradient (Perlin) noise, roughly -1..1. Each salt gives its own pattern.
float gnoise(vec3 p, uint salt) {
  vec3 fl = floor(p);
  ivec3 i = ivec3(fl);
  vec3 f = p - fl;
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float n000 = dot(gradientAt(i, salt), f);
  float n100 = dot(gradientAt(i + ivec3(1, 0, 0), salt), f - vec3(1.0, 0.0, 0.0));
  float n010 = dot(gradientAt(i + ivec3(0, 1, 0), salt), f - vec3(0.0, 1.0, 0.0));
  float n110 = dot(gradientAt(i + ivec3(1, 1, 0), salt), f - vec3(1.0, 1.0, 0.0));
  float n001 = dot(gradientAt(i + ivec3(0, 0, 1), salt), f - vec3(0.0, 0.0, 1.0));
  float n101 = dot(gradientAt(i + ivec3(1, 0, 1), salt), f - vec3(1.0, 0.0, 1.0));
  float n011 = dot(gradientAt(i + ivec3(0, 1, 1), salt), f - vec3(0.0, 1.0, 1.0));
  float n111 = dot(gradientAt(i + ivec3(1, 1, 1), salt), f - vec3(1.0));
  return 1.6 * mix(
    mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
    mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
    u.z);
}


// Heart (x² + y² − 1)³ = L·x²·y³ (y up): how much farther than the unit circle its contour lies
// in direction dir (screen y points down). Distance divided by this draws heart-shaped level
// lines. L = 1 is the classic curve, whose top notch barely shows on a glyph grid; at 2 the
// lobes are larger, the notch deeper and the tip sharper.
const float HEART_LOBES = 2.0;
float heartReach(vec2 dir) {
  float up = -dir.y;
  float k = HEART_LOBES * dir.x * dir.x * up * up * up;
  float kc = sign(k) * pow(abs(k), 1.0 / 3.0);
  float r = 1.0;
  for (int i = 0; i < 8; i++) r = sqrt(max(0.04, 1.0 + kc * pow(r, 5.0 / 3.0)));
  return r;
}

// Rounded rectangle: distance to the contour, negative inside.
float roundedBox(vec2 p, vec2 half_, float radius) {
  vec2 q = abs(p) - half_ + radius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  c.y = u_rows - 1 - c.y;
  vec2 p = u_origin + vec2(c) * u_cell;

  // Hand: click ripples and the cursor's warm trail.
  vec2 push = vec2(0.0);
  float wave = 0.0, glow = 0.0, stir = 0.0, warmth = 0.0;
  if (u_tapCount + u_trailCount > 0) {
    // The sample point is nudged by noise, so a ripple has a living edge, not a compass circle.
    vec2 near = p + 18.0 * vec2(
      gnoise(vec3(p / 90.0, u_now * 0.15), 0x31u),
      gnoise(vec3(p / 90.0 + 7.3, u_now * 0.15), 0x32u));
    for (int i = 0; i < 6; i++) {
      if (i >= u_tapCount) break;
      vec4 tap = u_taps[i];
      float age = max(u_now - tap.z, 0.0);
      vec2 away = near - tap.xy;
      float dist = length(away);
      float reach = tap.w < 0.0 ? dist / heartReach(away / max(dist, 0.001)) : dist;
      // The front flies out fast and brakes. Its outer edge is sharp, which is where the shape
      // reads (circle or heart); inside is a decaying tail with crests.
      float radius = 560.0 * (1.0 - exp(-age / 1.2));
      float behind = radius - reach;
      float width = 70.0 + 70.0 * age;
      float front = smoothstep(-14.0, 6.0, behind) * exp(-behind * behind / (width * width));
      float strength = abs(tap.w) * exp(-age / 1.4) * front;
      wave += strength * (0.75 + 0.5 * cos(behind * (TAU / 120.0)));
      // The ripple pushes the air aside: behind it shows the pattern carried in from outside.
      push += (away / max(dist, 1.0)) * 36.0 * strength;
      stir += strength;
      // Colour sits at the front and right after the click; a short afterglow trails the front.
      float after = smoothstep(0.0, 60.0, behind) * exp(-max(behind, 0.0) / 240.0);
      glow += abs(tap.w) * (exp(-age / 0.9) * front + 0.6 * exp(-age / 1.2) * after);
    }
    for (int i = 0; i < 32; i++) {
      if (i >= u_trailCount) break;
      vec4 dot_ = u_trail[i];
      vec2 d = near - dot_.xy;
      warmth += dot_.z * exp(-dot(d, d) * dot_.w);
    }
    // However much the cursor moves, the air warms up only to a limit.
    warmth = 1.0 - exp(-1.6 * warmth);
  }

  // Wind.
  vec2 from = p - push;
  vec2 across = vec2(-u_heading.y, u_heading.x);
  // The wind's bed bends slowly, so gusts do not run along a ruler.
  vec2 bend = vec2(
    gnoise(vec3(from / 420.0, u_clock * 0.035), 0x41u),
    gnoise(vec3(from / 420.0 + 11.7, u_clock * 0.035), 0x42u));
  vec2 bent = from + 85.0 * bend;
  vec2 q = vec2(dot(bent, u_heading), dot(bent, across));
  float carried = u_speed * u_clock;
  q.x -= carried;
  // The air curls as it goes, and gust edges trail after the eddies.
  vec2 curl = vec2(
    gnoise(vec3(q / (0.9 * u_gust.y), u_clock * 0.06), 0x43u),
    gnoise(vec3(q / (0.9 * u_gust.y) + 5.1, u_clock * 0.06), 0x44u));
  q += (0.55 + 0.4 * min(stir, 1.5)) * u_gust.y * curl;
  // A gust: four octaves, stretched along the wind.
  float gust = 0.0, amp = 1.0, power = 0.0;
  vec2 size = u_gust;
  for (int i = 0; i < 4; i++) {
    float k = float(i);
    gust += amp * gnoise(vec3(q / size, u_clock * (0.05 + 0.02 * k) + 9.0 * k), 0x50u + uint(i));
    power += amp * amp;
    amp *= 0.55;
    size *= vec2(0.52, 0.6);
  }
  gust *= inversesqrt(power);
  // Screen-sized swells gather the light together: the screen is rarely all empty or all full.
  // The crest hurries and lags without a beat.
  float swell = cos((q.x + 0.35 * u_span * gnoise(vec3(u_clock * 0.04, q.y / 700.0, 3.0), 0x45u)) * (TAU / u_span));
  // Inside a gust, thin streaks, like wind drawing on water.
  float streak = 1.0 - smoothstep(0.0, 0.5, abs(gnoise(vec3((q.x - 0.5 * carried) / 150.0, q.y / 22.0, u_clock * 0.18), 0x46u)));

  float field = 1.25 * gust + 0.32 * swell + 1.5 * wave;
  float lit = smoothstep(LEVEL - BAND, LEVEL + BAND, field);
  float blown = lit * lit * (0.5 + 0.5 * streak);
  // The trail glows on its own, in the fine grain of the air, wind or no wind.
  float grain = gnoise(vec3(q / 26.0, u_clock * 0.3), 0x47u);
  float trail = warmth * smoothstep(-0.45, 0.35, grain);
  float strength = 1.0 - (1.0 - blown) * (1.0 - 0.85 * trail);

  // Quieter behind content.
  float hand = min(1.0, 2.0 * stir + warmth);
  float calm = 1.0;
  if (u_calm.z > 0.0) {
    float edge = roundedBox(p - u_calm.xy, u_calm.zw, 28.0);
    // Only plain text calms the field: the input is opaque, the wordmark and the chips are glass
    // and should show the field. Hence a short transition, glyphs return by the chips.
    calm = mix(CALM_FLOOR, 1.0, smoothstep(-16.0, 90.0, edge));
    // What the hand did shows by the text too, only muted.
    calm = max(calm, 0.45 * hand);
  }
  // What the hand did shows at once, however much wind has arrived.
  float shown = max(u_reveal, hand);

  // The trail is lightly tinted with ripple colour, or a grey trail drowns in grey wind.
  o = vec4(
    clamp(strength * calm * shown, 0.0, 1.0),
    clamp(glow + 0.22 * warmth, 0.0, 1.0),
    clamp(stir, 0.0, 1.0),
    1.0);
}
`,b=`#version 300 es
precision highp float;
precision highp int;

uniform highp sampler2D u_field;
uniform highp sampler2D u_atlas;
// Cell in device pixels; grid columns and rows.
uniform ivec2 u_cell;
uniform ivec2 u_grid;
uniform int u_glyphs;
uniform int u_atlasColumns;
uniform uint u_seed;
uniform float u_clock;
uniform vec3 u_ink;
uniform vec3 u_glow;
// Glyph brightness in the wind, and how many times brighter a ripple-tinted glyph is.
uniform float u_base;
uniform float u_boost;

out vec4 o;

${v}

void main() {
  ivec2 px = ivec2(gl_FragCoord.xy);
  px.y = u_grid.y * u_cell.y - 1 - px.y;
  ivec2 c = px / u_cell;
  vec4 f = texelFetch(u_field, ivec2(c.x, u_grid.y - 1 - c.y), 0);
  if (f.r < 0.004) {
    o = vec4(0.0);
    return;
  }
  // Each cell walks the glyph set at its own pace from its own place; a cell shaken by a click
  // runs through a few glyphs and settles.
  uint h = mixBits(uint(c.x) * 0x9E3779B9u ^ mixBits(uint(c.y) ^ u_seed));
  float pace = 0.55 + 0.9 * unit(mixBits(h ^ 0xA5u));
  int steps = int(floor(u_clock * ${g} * pace + 8.0 * unit(mixBits(h ^ 0x5Au))))
            + int(floor(10.0 * f.b + unit(mixBits(h ^ 0x3Cu))));
  int g = (int(h >> 9) + steps) % u_glyphs;
  ivec2 tile = ivec2(g % u_atlasColumns, g / u_atlasColumns) * u_cell;
  float ink = texelFetch(u_atlas, tile + (px - c * u_cell), 0).r;
  if (ink <= 0.0) {
    o = vec4(0.0);
    return;
  }
  // Ripple colour switches on fully and leaves fast: a half mix of grey and green reads as dirt,
  // not light.
  float tint = smoothstep(0.06, 0.34, f.g);
  float light = min(1.0, f.r * u_base * mix(1.0, u_boost, tint));
  float a = ink * light;
  o = vec4(mix(u_ink, u_glow, tint) * a, a);
}
`,x=`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/`,S=16,C=10,w=2,ee=33,te=16,ne=66,T=120,E=6,D=3,re=2.5,O=120,k=.3,A=3,j=/swiftshader|llvmpipe|softpipe|software|warp|basic render/i,ie=[`a`,`button`,`input`,`textarea`,`select`,`label`,`summary`,`[contenteditable]:not([contenteditable='false'])`,`[tabindex]:not([tabindex='-1'])`,...[`button`,`link`,`textbox`,`combobox`,`listbox`,`option`,`menu`,`menuitem`,`tab`,`switch`,`checkbox`,`radio`,`slider`,`dialog`].map(e=>`[role='${e}']`)].join(`,`),M=`(prefers-contrast: more), (forced-colors: active)`;function N(e){return`WebGL2RenderingContext`in e&&typeof e.matchMedia==`function`&&!e.matchMedia(`(prefers-contrast: more), (forced-colors: active)`).matches}function P(e){let t=Math.min(1,Math.max(0,e));return t*t*(3-2*t)}function ae(e){return .5-Math.sin(Math.asin(1-2*Math.min(1,Math.max(0,e)))/3)}function F(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function oe(e){let t=F(e),n=.26+.44*t(),r=t()<.5?n:Math.PI-n;return{seed:e,heading:[Math.cos(r),Math.sin(r)],speed:40+22*t(),gust:[400+160*t(),120+60*t()],clock:64*t()}}function I(e,t){let n=e.createProgram(),r=[[e.VERTEX_SHADER,_],[e.FRAGMENT_SHADER,t]];for(let[t,i]of r){let r=e.createShader(t);if(!r)return null;e.shaderSource(r,i),e.compileShader(r),e.getShaderParameter(r,e.COMPILE_STATUS)||console.warn(`[sabka-wind] shader did not compile:`,e.getShaderInfoLog(r)),e.attachShader(n,r),e.deleteShader(r)}return e.linkProgram(n),e.getProgramParameter(n,e.LINK_STATUS)?n:(console.warn(`[sabka-wind] shader program did not link:`,e.getProgramInfoLog(n)),e.deleteProgram(n),null)}function L(e,t){let n=e.createTexture();return e.activeTexture(e.TEXTURE0+t),e.bindTexture(e.TEXTURE_2D,n),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),n}function R(e,t,n,r,i){let a=Math.ceil(64/S),o=e.createElement(`canvas`);o.width=S*n,o.height=a*r;let s=o.getContext(`2d`,{willReadFrequently:!0});if(!s)return null;let c=i>=1.5?300:400;s.font=`${c} 100px ${t}`;let l=s.measureText(`0`).width/100||.6;s.font=`${c} ${Math.min(Math.round(C*i),Math.floor((n-1)/l))}px ${t}`,s.textAlign=`left`,s.textBaseline=`alphabetic`,s.fillStyle=`#fff`;let u=s.measureText(`Mg`),d=u.fontBoundingBoxAscent||u.actualBoundingBoxAscent,f=u.fontBoundingBoxDescent||u.actualBoundingBoxDescent,p=Math.round((r-(d+f))/2+d),m=Math.floor((n-s.measureText(`0`).width)/2);[...x].forEach((e,t)=>{let i=t%S*n,a=Math.floor(t/S)*r;s.save(),s.beginPath(),s.rect(i,a,n,r),s.clip(),s.fillText(e,i+m,a+p),s.restore()});let h=s.getImageData(0,0,o.width,o.height).data,g=new Uint8Array(o.width*o.height);for(let e=0;e<g.length;e+=1)g[e]=h[e*4+3]??0;return g}function se(e){let t=e.createElement(`canvas`).getContext(`2d`,{willReadFrequently:!0});return(e,n)=>{if(!t||!e)return n;t.clearRect(0,0,1,1),t.fillStyle=`#000`,t.fillStyle=e,t.fillRect(0,0,1,1);let[r=0,i=0,a=0]=t.getImageData(0,0,1,1).data;return[r/255,i/255,a/255]}}function z(e,t){let n=I(e,y),r=I(e,b);if(!n||!r)return null;let i=L(e,0),a=L(e,1),o=e.createFramebuffer(),s=e.createVertexArray();e.bindVertexArray(s),e.pixelStorei(e.UNPACK_ALIGNMENT,1),e.disable(e.BLEND);let c=(t,n)=>e.getUniformLocation(t,n),l={rows:c(n,`u_rows`),origin:c(n,`u_origin`),cellCss:c(n,`u_cell`),fieldClock:c(n,`u_clock`),now:c(n,`u_now`),reveal:c(n,`u_reveal`),span:c(n,`u_span`),calm:c(n,`u_calm`),tapCount:c(n,`u_tapCount`),taps:c(n,`u_taps`),trailCount:c(n,`u_trailCount`),trail:c(n,`u_trail`),cell:c(r,`u_cell`),grid:c(r,`u_grid`),glyphClock:c(r,`u_clock`),ink:c(r,`u_ink`),glow:c(r,`u_glow`)};return e.useProgram(n),e.uniform1ui(c(n,`u_seed`),t.seed),e.uniform2f(c(n,`u_heading`),...t.heading),e.uniform1f(c(n,`u_speed`),t.speed),e.uniform2f(c(n,`u_gust`),...t.gust),e.useProgram(r),e.uniform1i(c(r,`u_field`),0),e.uniform1i(c(r,`u_atlas`),1),e.uniform1ui(c(r,`u_seed`),t.seed),e.uniform1i(c(r,`u_glyphs`),64),e.uniform1i(c(r,`u_atlasColumns`),S),e.uniform1f(c(r,`u_base`),k),e.uniform1f(c(r,`u_boost`),A),{field:n,glyphs:r,fieldTexture:i,atlasTexture:a,framebuffer:o,vao:s,u:l}}function ce(e,t,n){let r=e.createElement(`canvas`);r.style.position=`absolute`,r.style.display=`block`;let i=r.getContext(`webgl2`,{alpha:!0,antialias:!1,depth:!1,stencil:!1,premultipliedAlpha:!0,preserveDrawingBuffer:!1,powerPreference:`low-power`,failIfMajorPerformanceCaveat:!0});if(!i)return null;let a=()=>(i.getExtension(`WEBGL_lose_context`)?.loseContext(),null),o=i.getExtension(`WEBGL_debug_renderer_info`);if(o&&j.test(String(i.getParameter(o.UNMASKED_RENDERER_WEBGL))))return a();let s=z(i,n);if(!s)return a();let c=0,l=0,u=0,d=null,f=0,p=0,m=()=>{s&&=(i.deleteProgram(s.field),i.deleteProgram(s.glyphs),i.deleteTexture(s.fieldTexture),i.deleteTexture(s.atlasTexture),i.deleteFramebuffer(s.framebuffer),i.deleteVertexArray(s.vao),null)};return{canvas:r,resize(a,o,d){if(!s)return!1;let{field:f,glyphs:p,fieldTexture:m,framebuffer:h,u:g}=s;if(a.cellWidth!==u){let n=R(e,t,a.cellWidth,a.cellHeight,a.scale);if(!n)return!1;i.activeTexture(i.TEXTURE1),i.bindTexture(i.TEXTURE_2D,s.atlasTexture),i.texImage2D(i.TEXTURE_2D,0,i.R8,S*a.cellWidth,Math.ceil(64/S)*a.cellHeight,0,i.RED,i.UNSIGNED_BYTE,n),u=a.cellWidth}let _=a.columns*a.cellWidth,v=a.rows*a.cellHeight;r.width!==_&&(r.width=_),r.height!==v&&(r.height=v);let y=e=>`${e/a.scale}px`;r.style.left=y(a.left),r.style.top=y(a.top),r.style.width=y(_),r.style.height=y(v),(a.columns!==c||a.rows!==l)&&(c=a.columns,l=a.rows,i.activeTexture(i.TEXTURE0),i.bindTexture(i.TEXTURE_2D,m),i.texImage2D(i.TEXTURE_2D,0,i.RGBA8,c,l,0,i.RGBA,i.UNSIGNED_BYTE,null),i.bindFramebuffer(i.FRAMEBUFFER,h),i.framebufferTexture2D(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,m,0),i.bindFramebuffer(i.FRAMEBUFFER,null));let b=[a.cellWidth/a.scale,a.cellHeight/a.scale];return i.useProgram(f),i.uniform1i(g.rows,l),i.uniform2f(g.origin,a.left/a.scale+b[0]/2,a.top/a.scale+b[1]/2),i.uniform2f(g.cellCss,...b),i.uniform1f(g.span,.62*(Math.abs(n.heading[0])*o+Math.abs(n.heading[1])*d)),i.useProgram(p),i.uniform2i(g.cell,a.cellWidth,a.cellHeight),i.uniform2i(g.grid,c,l),!0},setColors(e,t){s&&(i.useProgram(s.glyphs),i.uniform3f(s.u.ink,...e),i.uniform3f(s.u.glow,...t))},setCalm(e){s&&(i.useProgram(s.field),i.uniform4f(s.u.calm,...e))},draw({clock:e,now:t,reveal:n,touch:a}){if(c===0||!s)return;let{field:o,glyphs:u,fieldTexture:m,atlasTexture:h,framebuffer:g,u:_}=s;d&&=(p=i.getSyncParameter(d,i.SYNC_STATUS)===i.SIGNALED?0:p+1,i.deleteSync(d),null),i.bindFramebuffer(i.FRAMEBUFFER,g),i.viewport(0,0,c,l),i.useProgram(o),i.uniform1f(_.fieldClock,e),i.uniform1f(_.now,t),i.uniform1f(_.reveal,n),i.uniform1i(_.tapCount,a?.tapCount??0),i.uniform1i(_.trailCount,a?.trailCount??0),a&&(i.uniform4fv(_.taps,a.taps),i.uniform4fv(_.trail,a.trail)),i.drawArrays(i.TRIANGLES,0,3),i.bindFramebuffer(i.FRAMEBUFFER,null),i.viewport(0,0,r.width,r.height),i.useProgram(u),i.uniform1f(_.glyphClock,e),i.activeTexture(i.TEXTURE0),i.bindTexture(i.TEXTURE_2D,m),i.activeTexture(i.TEXTURE1),i.bindTexture(i.TEXTURE_2D,h),i.drawArrays(i.TRIANGLES,0,3),f+=1,f%4==0&&(d=i.fenceSync(i.SYNC_GPU_COMMANDS_COMPLETE,0),i.flush())},fellBehind(){return p<2?!1:(p=0,!0)},restore(){return s=z(i,n),c=0,l=0,u=0,d=null,p=0,s!==null},destroy(){d&&i.deleteSync(d),m(),a(),r.remove()}}}function le(e,t,n){let r,i,a=!1,o=!1,s=()=>a&&!e.document.hidden&&n.allowed(),c=()=>{e.clearTimeout(r),i!==void 0&&e.cancelAnimationFrame(i),r=void 0,i=void 0},l=()=>{r=e.setTimeout(()=>{r=void 0,i=e.requestAnimationFrame(u)},n.interval())},u=()=>{i=void 0,o=!0;try{t()}finally{o=!1}s()&&l()},d=()=>{if(o)return;let e=r!==void 0||i!==void 0;s()&&!e?(n.onResume(),l()):!s()&&e&&c()};return e.document.addEventListener(`visibilitychange`,d),{refresh:d,start(){a=!0,d()},destroy(){a=!1,c(),e.document.removeEventListener(`visibilitychange`,d)}}}function B(e,t){let n=e.ownerDocument,r=n.defaultView,i=[],o=!1,s=!0,c=()=>{o||(o=!0,i.reverse().forEach(e=>e()))};if(!r)return{setActive:()=>{},destroy:c};let l=oe(r.crypto.getRandomValues(new Uint32Array(1))[0]??1),u=h(),d=se(n),f=r.performance.now(),p=()=>(r.performance.now()-f)/1e3,m=null,g=!1,_=!1,v=l.clock,y=0,b=0,x=0,S=0,C=T,k=!1,A=!1,j=!1,M=!1,N=!1,F=``,I=(e,n)=>{if(!m||_)return;let r=p();m.draw({clock:v,now:r,reveal:e,touch:n?u.frame(r):null}),g||(g=!0,A||t.onReady?.())},L=t.still?null:le(r,()=>{let e=r.performance.now(),n=b?Math.min(Math.max((e-b)/1e3,0),.25):0;b=e,x+=n;let i=1-P((x-C)/E);v+=n*i*P((x-S)/re),y=P((x-S)/D)*i,I(y,!0),!A&&i<.5&&(A=!0,t.onCalm?.()),i===0&&!u.busy(p())?k=!0:m?.fellBehind()&&(j&&(C=Math.min(C,x),M=!0),j=!0)},{interval:()=>j?ne:u.rippling(p())?te:ee,allowed:()=>m!==null&&N&&!k&&s&&!_,onResume:()=>{b=0}});L&&i.push(()=>L.destroy());let R=()=>{if(N){if(k)k=!1,M=!1,S=x,C=x+T;else if(x<C)C=x+T;else if(!M){let e=1-P((x-C)/E);S=x-D*ae(e),C=x+T}A&&x<C&&(A=!1,t.onWake?.()),L?.refresh()}},z=()=>{t.still?I(1,!1):I(k?0:y,!0)},B=()=>{if(!m)return;let t=r.getComputedStyle(e),n=t.getPropertyValue(`--accent-glow`).trim(),i=`${t.color}|${n}`;i!==F&&(F=i,m.setColors(d(t.color,[.52,.52,.53]),d(n,[.29,1,.64])),z())},V=()=>{if(!m)return;let n=t.findCalm?.()??[],r=e.getBoundingClientRect(),i=1/0,a=1/0,o=-1/0,s=-1/0;for(let e of n){let t=e.getBoundingClientRect();(t.width!==0||t.height!==0)&&(i=Math.min(i,t.left),a=Math.min(a,t.top),o=Math.max(o,t.right),s=Math.max(s,t.bottom))}m.setCalm(Number.isFinite(i)?[(i+o)/2-r.left,(a+s)/2-r.top,(o-i)/2,(s-a)/2]:[0,0,0,0])},H=null,U,W=()=>{if(U=void 0,!H||o||_)return;let{deviceWidth:s,deviceHeight:u,cssWidth:d,cssHeight:f}=H,p=a({deviceWidth:s,deviceHeight:u,scale:Math.min(r.devicePixelRatio||1,w)});if(!p)N=!1,m&&(m.canvas.style.visibility=`hidden`),L?.refresh();else{if(!m){if(m=ce(n,r.getComputedStyle(e).fontFamily,l),!m){c();return}let a=m,o=e=>{e.preventDefault(),_=!0,g=!1,L?.refresh(),t.onLost?.()},s=()=>{_=!1,a.restore()?(F=``,r.clearTimeout(U),W()):(t.onLost?.(),c())};a.canvas.addEventListener(`webglcontextlost`,o),a.canvas.addEventListener(`webglcontextrestored`,s),i.push(()=>{a.canvas.removeEventListener(`webglcontextlost`,o),a.canvas.removeEventListener(`webglcontextrestored`,s),a.destroy()}),e.append(a.canvas)}m.resize(p,d,f)?(N=!0,m.canvas.style.visibility=``,B(),V(),z(),L?.start()):(t.onLost?.(),c())}},G=new ResizeObserver(n=>{let i=n.find(t=>t.target===e);if(i){let e=Math.min(r.devicePixelRatio||1,w),t=i.contentBoxSize?.[0]??{inlineSize:i.contentRect.width,blockSize:i.contentRect.height},n=e===r.devicePixelRatio?i.devicePixelContentBoxSize?.[0]:void 0;H={deviceWidth:n?.inlineSize??Math.round(t.inlineSize*e),deviceHeight:n?.blockSize??Math.round(t.blockSize*e),cssWidth:t.inlineSize,cssHeight:t.blockSize},r.clearTimeout(U),U=r.setTimeout(W,m?O:0)}n.some(t=>t.target!==e)&&(V(),t.still&&z())}),K=()=>(t.findCalm?.()??[]).forEach(e=>G.observe(e));i.push(()=>{G.disconnect(),r.clearTimeout(U)});let q=null,J=()=>{Y();let t=e.getBoundingClientRect(),n=Math.min(r.devicePixelRatio||1,w);H={deviceWidth:Math.round(t.width*n),deviceHeight:Math.round(t.height*n),cssWidth:t.width,cssHeight:t.height},r.clearTimeout(U),U=r.setTimeout(W,O)},Y=()=>{q?.removeEventListener(`change`,J),q=r.matchMedia(`(resolution: ${r.devicePixelRatio||1}dppx)`),q.addEventListener(`change`,J)};i.push(()=>q?.removeEventListener(`change`,J));let X,Z=new MutationObserver(()=>{X===void 0&&(X=r.requestAnimationFrame(()=>{X=void 0,B()}))});if(Z.observe(n.documentElement,{attributes:!0,attributeFilter:[`class`,`style`,`data-theme`]}),i.push(()=>{Z.disconnect(),X!==void 0&&r.cancelAnimationFrame(X)}),!t.still){let r=t.pointerTarget,a=t=>{let n=e.getBoundingClientRect();return[t.clientX-n.left,t.clientY-n.top]},o=e=>{e.pointerType===`mouse`&&m&&(u.move(...a(e),p()),R())},s=null,c=e=>{if(e.button!==0||!m||(e.target instanceof Element?e.target:null)?.closest(ie))return;let[t,n]=a(e);e.pointerType===`mouse`?(u.tap(t,n,p()),R()):s={id:e.pointerId,x:t,y:n}},l=e=>{let t=s;s=null,t&&t.id===e.pointerId&&m&&(u.tap(t.x,t.y,p()),R())},d=()=>{s=null},f=()=>u.leave(),h=()=>{n.hidden||R()};r.addEventListener(`pointermove`,o,{passive:!0}),r.addEventListener(`pointerdown`,c,{passive:!0}),r.addEventListener(`pointerup`,l,{passive:!0}),r.addEventListener(`pointercancel`,d,{passive:!0}),r.addEventListener(`pointerleave`,f,{passive:!0}),n.addEventListener(`visibilitychange`,h),i.push(()=>{r.removeEventListener(`pointermove`,o),r.removeEventListener(`pointerdown`,c),r.removeEventListener(`pointerup`,l),r.removeEventListener(`pointercancel`,d),r.removeEventListener(`pointerleave`,f),n.removeEventListener(`visibilitychange`,h)})}let Q=r.getComputedStyle(e).fontFamily;return n.fonts.load(`300 20px ${Q}`).catch(()=>[]).then(()=>{if(!o){try{G.observe(e,{box:`device-pixel-content-box`})}catch{G.observe(e),Y()}K()}}),{setActive(e){o||s===e||(s=e,e?R():L?.refresh())},destroy:c}}var V={src:`/_astro/field-glyphs.B8PzZZYL.webp`,width:854,height:1036,format:`webp`},H={src:`/_astro/field-gusts.B6hQ6NGO.webp`,width:294,height:92,format:`webp`},U={marketing:{title:`Market analysis`,body:`**INPUT DATA**
- Company_name: [COMPANY_NAME]
- Field_of_business: [FIELD_OF_BUSINESS]
- City_region: [CITY_REGION]
- Website_and_social_links: [LINKS]
- Competitor_list: [COMPETITORS]

**ROLE**
You are a marketing analyst and brand strategist with expertise in {field_of_business}. You run a surgically precise positioning analysis: you uncover hidden insights and give concrete recommendations.

**TASK**
Run a comprehensive positioning analysis of {company_name} in {field_of_business} on the {city_region} market. Use open sources: the website and social accounts from {links}, reviews (2GIS, Yandex Maps, industry portals), data on {competitors}.

*If web access is unavailable, base the analysis on typical patterns of {field_of_business} and trends of the {city_region} market. Mark assumptions explicitly.*

**METHODOLOGY:** JTBD · Blue Ocean · Brand Positioning Canvas · Customer Journey

**ANALYSIS STRUCTURE**

1. **Overall brand impression**: visual style, atmosphere, first impression, emotional response from {links}

2. **Target audience (JTBD)**: demographics, psychographics, functional / emotional / social jobs, customer pains

3. **Value proposition**: the main promises of {company_name}, how they are backed, proof, fit with customer jobs

4. **USP and blue ocean**: differentiators, unique technologies and methods, unoccupied niches relative to {competitors}

5. **Communication strategy**: tone, consistency of voice, content strategy, channels

6. **Reputation analysis**: reviews by platform in {city_region}, frequent praise and complaints, comparison with {competitors}

7. **Competitive positioning (Strategy Canvas)**: competitor map, comparative analysis of {competitors}, free niches, price positioning

8. **Positioning SWOT**: strengths, weak zones, growth opportunities, threats and risks

9. **Strategic recommendations**: current positioning, key insights, recommendations for improvement, action priorities

**ANALYSIS REQUIREMENTS**
- Objectivity: note both strengths and weaknesses
- Context of the local {city_region} market and the specifics of {field_of_business}
- Bring out non-obvious insights, not only the obvious
- Practical recommendations with priorities`},content:{title:`A landing page with maximum conversion`,body:`**INPUT DATA**
- Product_or_service: [PRODUCT_OR_SERVICE]
- Target_audience: [TARGET_AUDIENCE]
- Main_problem: [MAIN_PROBLEM]
- Desired_result: [DESIRED_RESULT]
- USP: [UNIQUE_SELLING_PROPOSITION]
- Price: [PRICE]
- Target_action: [TARGET_ACTION]

**ROLE**
You are a conversion architect. Every block of the landing page closes a specific objection of {target_audience}. You speak the language of benefits, not features. No filler, only value.

**HIDDEN ANALYSIS: run it before you write, do not show it in the final answer:**

*JTBD and 5 WHYS:*
- What "job" does {target_audience} hire {product_or_service} to do?
- Why are they looking to solve {main_problem} right now?
- Why didn't they solve it before?
- Why are they afraid of getting it wrong?
- Why does {desired_result} matter right now?
- What emotional pain are they running from (shame, fear, frustration)? What state are they reaching for (confidence, control, freedom)?

*Forced contradiction:*
- Thesis: what {target_audience} says in public
- Antithesis: hidden motives (status, FOMO, proving something to themselves, fatigue)
- Synthesis: how to join both levels, the rational and the emotional layer of the landing page

*Purchase barriers:*
- Rational: price, quality, complexity, risk → removed by breaking down the value, proof, a simple process, guarantees
- Emotional: fear of a mistake, distrust, shame, procrastination → removed by empathy, success stories, a low entry threshold
- Social: "what will others think" → removed by reviews from "people like me", normalising the problem

*Bullshit detector before the final answer:* any clichés like "unique / best / innovative"? Does the tone match expectations? Too many CTAs?

---

**LANDING PAGE STRUCTURE**

**BLOCK 1: HEADLINE + USP** *(closes: "Who is this? Is it for me?")*
- Headline: a promise of {desired_result} through the hidden motive from Forced Contradiction
- Subheadline: how {main_problem} gets solved, without complexity
- USP: {unique_selling_proposition} in one sentence

*Approaches for the headline (adapt, do not copy):*
- Paradox: "Why it's cheaper NOT to [action]" / "What if [common belief] is false?"
- Contrast: "From [bad] to [good] in [time]"
- Provocation: "Don't make this mistake when you [action]"

**BLOCK 2: PROBLEM** *(closes: "They don't know my situation")*
Describe {main_problem} through: emotional consequences (how {target_audience} feels) + practical consequences (what they lose in money or time) + what happens if they ignore it + empathy ("we know how it is..."). Use the deep level of pain from the 5 WHYS, not the surface.

**BLOCK 3: SOLUTION** *(closes: "It's complicated, not for me")*
The method + why it works for {target_audience} + how simple it is to adopt. If the hidden motive is status, show the prestige of the method. If it's fear, show safety.

**BLOCK 4: BENEFITS** *(closes: "So what's in it for me?")*
3 benefits by the formula: "You get [what] → which means [change in life]"
Focus on changes, not features: time → "more time for [what matters]", money → "the chance to [do what]", nerves → "calm and [state]".

**BLOCK 5: HOW IT WORKS** *(closes: "I don't get the mechanics")*
Step 1: a simple action by the customer → Step 2: your transparent actions → Step 3: a concrete measurable result.

**BLOCK 6: SOCIAL PROOF** *(closes: "Does it actually work?")*
2 reviews with: who (similar to {target_audience}) + the problem "before" + the result with numbers + emotion. Statistics: customers, average result, speed. Type of proof for the audience: authorities / peers / numbers.

**BLOCK 7: EXPERTISE** *(closes: "Can we trust them?")*
Experience solving {main_problem} + cases and achievements + specialisation in {target_audience}. No bragging, through facts.

**BLOCK 8: OFFER** *(closes: "Too expensive / I don't see the value")*
What exactly is included + {price} through ROI ("an investment of X pays back in Y") + bonuses if any.

**BLOCK 9: URGENCY** *(closes: "I'll think about it tomorrow")*
A real limit without manipulation. What exactly {target_audience} loses by putting it off: missed gain / the problem getting worse / losing the terms.

**BLOCK 10: GUARANTEES** *(closes: "What if it doesn't work out?")*
A guarantee for the main fear: losing money → refund / I won't manage → support / it won't fit → a trial period.

**BLOCK 11: FINAL CALL** *(closes: "Too lazy / no time")*
Instructions for {target_action} (as simple as possible) + a reminder through {desired_result} + ease ("30 seconds", "3 clicks").

---

**OUTPUT FORMAT**

\`\`\`
CONCEPT: {product_or_service}
FOR: {target_audience}
ESSENCE: [one sentence, the main idea of the landing page]
GOAL: {target_action}

1. HEADLINE | Subheadline
2. PROBLEM
3. SOLUTION
4. BENEFITS: • [Benefit 1 → change] • [Benefit 2 → change] • [Benefit 3 → change]
5. HOW IT WORKS: Step 1 → Step 2 → Step 3
6. PROOF: [Review 1] [Review 2] [Statistics]
7. EXPERTISE
8. OFFER: Contents | Price + ROI | Bonuses
9. URGENCY
10. GUARANTEES
11. CTA

KEY PHRASES: [5 phrasings in the language of {target_audience}]
\`\`\``},images:{title:`YouTube thumbnail`,image:!0,body:`Face / Photo: [YOUR FACE / ATTACHED PHOTO]
Outfit: [OUTFIT DESCRIPTION]
Branding: Logo [YOUR LOGO / NAME], Headline "[YOUR HEADLINE]"
Font: [bold / condensed / modern / handwritten]
Text style: [COLOUR] with [outline / glow / shadow]
Colour and mood: [cinematic / high-contrast / clean YouTube style / dark dramatic]

CRITICALLY IMPORTANT: The whole result must be generated as ONE image. Do not create collages or alternatives to choose from.

Parse the parameters from the block above and edit the uploaded thumbnail:

Base: Keep the composition, camera angle, lighting, depth and proportions.

Face swap: Match the face from the parameters perfectly, keeping the expression, gaze direction, skin texture and lighting. Natural blending.

Clothing: Replace the outfit according to the parameters, keeping the fabric folds, shadows and body shape.

Text and logo: Integrate the branding from the parameters.

Quality: Ultra-sharp, no blown highlights, perfect edges of hair and face, optimised for mobile viewing, skin tone preserved.

STRICT TEXT AND COMPOSITION RULE: Render the text with absolutely no mistakes, letter for letter as given in the parameters. No extra words, hieroglyphs or distorted letters. The composition follows the rule of thirds: the face or subject takes one part, large readable text takes the free space, creating a strong visual hook without losing taste.

NO ARTEFACTS: Avoid the "pasted-on" text effect. The text must sit in the scene's lighting: cast correct shadows or have a realistic glow.`},sales:{title:`A cold email sequence`,body:`**INPUT DATA**
- Profession_or_position: [PROFESSION_OR_POSITION]
- Company_name: [COMPANY_NAME]
- What_you_sell: [WHAT_YOU_SELL]
- Target_audience: [TARGET_AUDIENCE]
- Pain_point_list: [PAIN_POINT_LIST]
- Unique_solution: [UNIQUE_SOLUTION]
- Average_deal: [AVERAGE_DEAL]
- Region: [REGION]
- Number_of_emails: [NUMBER_OF_EMAILS]
- Tone: [TONE]

**ROLE**
You are a genius of cold email sales. Your emails don't get deleted: they get read, saved and forwarded to colleagues. In 30 seconds of reading you hook a stranger so that they want to work with you.

**HIDDEN ANALYSIS: run it before you write, do not show it in the final answer:**

*JTBD + 5 WHYS for each pain from {pain_point_list}:*
From the surface want ("I want convenience") to the real fear ("I'm afraid of looking incompetent in front of my boss").

*Forced contradiction:* what {target_audience} say vs what really drives the purchase. Example: they say "we need to save money", they're really afraid of "picking wrong and getting it in the neck".

*Three types of barriers:*
- Rational: price {average_deal}, complexity of adoption, decision time
- Emotional: fear of a mistake, shame for not sorting it out earlier
- Social: whether approval is needed, how to justify it to the team

*Multi-perspective:*
- Psychology: which trigger starts the decision to buy right now
- Economics: what they lose every day without a solution, in money, time, opportunities
- Social context: who influences the decision, what a successful purchase looks like in the eyes of others

---

**EVERY EMAIL contains, organically (no technical labels):**
1. **Personalisation**: a hook about the recipient's company or situation that hits the real motive
2. **Problem**: a pain from {pain_point_list} + the cost of inaction in money or time
3. **Cause**: why the problem doesn't get solved, uncovers the forced contradiction
4. **Solution**: {what_you_sell} through {unique_solution}, removes at least one barrier
5. **Proof**: a concrete case with numbers
6. **Call**: one action + why exactly now
7. **P.S.**: an extra psychological trigger

**Constraints:** 120 words at most · no spam words (free, discount, sale, unique) · tone {tone} · take the mentality of {region} into account

**Psychological principles:** social proof with numbers (not "many clients" but a concrete result) · scarcity without falseness · reciprocity (give value before selling) · every email closes at least one of the three barriers

**Banned clichés:**
- "It's not just X, it's Y" → write "Y"
- "You're not X, you're Y" → write "You're Y"
- "We don't sell X, we sell Y" → write "We sell Y"
- A positive statement always comes before a negation

---

**OUTPUT FORMAT**

**BLOCK 1: PSYCHOLOGICAL PORTRAIT OF {target_audience}** *(shown explicitly)*
- JTBD insights: what they say vs what really drives them · deep motivations · three types of barriers · multi-perspective
- Psychological profile: main fears · true desires · typical objections · behaviour patterns

**BLOCK 2: {number_of_emails} COLD EMAILS**
\`\`\`
EMAIL [N]:
Subject: [text]

[Clean text with no technical labels, all 7 elements woven in organically]

P.S.: [text]
________________
\`\`\`

**BLOCK 3: A 3-EMAIL SEQUENCE**
A follow-up sequence for those who didn't reply, escalating the barrier removal. Same clean format.

**BLOCK 4: THE 5 BEST SUBJECT LINES**
A list of 5 subject lines for {target_audience} on the topic of {what_you_sell}.`}},W={root:`_root_15pfn_35`,still:`_still_15pfn_9`,host:`_host_15pfn_9`,stage:`_stage_15pfn_9`,column:`_column_15pfn_275`,hero:`_hero_15pfn_293`,logo:`_logo_15pfn_311`,guide:`_guide_15pfn_341`,chips:`_chips_15pfn_393`,chipRow:`_chipRow_15pfn_407`,chip:`_chip_15pfn_393`,composer:`_composer_15pfn_521`,field:`_field_15pfn_543`,glow:`_glow_15pfn_629`,bounce:`_bounce_15pfn_1`,snake:`_snake_15pfn_1`,toolbar:`_toolbar_15pfn_779`,toolbarStart:`_toolbarStart_15pfn_795`,toolbarEnd:`_toolbarEnd_15pfn_797`,toolbarModel:`_toolbarModel_15pfn_819`,gb:`_gb_15pfn_855`,gbFace:`_gbFace_15pfn_935`,gbIcon:`_gbIcon_15pfn_1017`,gbWide:`_gbWide_15pfn_1037`,gbTruncate:`_gbTruncate_15pfn_1049`,gbCollapsible:`_gbCollapsible_15pfn_1063`,gbLabel:`_gbLabel_15pfn_1085`,plus:`_plus_15pfn_1181`,functions:`_functions_15pfn_1213`,menu:`_menu_15pfn_1223`,"menu-in":`_menu-in_15pfn_1`,menuItem:`_menuItem_15pfn_1283`,menuIcon:`_menuIcon_15pfn_1367`,menuLabel:`_menuLabel_15pfn_1391`,menuDot:`_menuDot_15pfn_1399`},G=n(),K=e=>typeof e==`string`?e:e.src,q={"--wind-glyphs":`url("${K(V)}")`,"--wind-gusts":`url("${K(H)}")`},J=`(prefers-reduced-motion: reduce)`,Y=`[data-backdrop-calm]`,X=1200,Z=[`Grok 4.3`,`Claude Sonnet 5.5`,`Gemini 3.8 Flash`],Q=[{id:`marketing`,label:`Marketing`},{id:`content`,label:`Content`},{id:`images`,label:`Images`},{id:`sales`,label:`Sales`}],$=`url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%2064%22%3E%3Cpath%20d%3D%22M20.65%2017.185c3.539%200%206.664.677%209.376%202.029%202.712%201.352%204.87%203.258%206.471%205.72%201.3%201.945%202.156%204.158%202.566%206.64.17%201.03-.659%201.92-1.695%201.92h-6.35c-.865%200-1.59-.633-1.852-1.464a10.215%2010.215%200%200%200-1.154-2.472%208.188%208.188%200%200%200-2.945-2.758c-1.188-.676-2.608-1.015-4.261-1.015-2.093%200-3.927.595-5.502%201.785-1.55%201.163-2.764%202.84-3.642%205.03-.878%202.191-1.317%204.815-1.317%207.87%200%203.084.426%205.748%201.278%207.993.852%202.217%202.066%203.934%203.642%205.151%201.575%201.19%203.423%201.785%205.54%201.785%202.248%200%204.146-.689%205.696-2.068%201.246-1.09%202.136-2.511%202.67-4.26.255-.832.979-1.46%201.842-1.46h6.353c1.037%200%201.865.89%201.694%201.922-.403%202.439-1.232%204.638-2.486%206.597-1.575%202.46-3.706%204.394-6.392%205.8-2.686%201.38-5.838%202.07-9.453%202.07-4.314%200-8.021-.988-11.12-2.962-3.1-2.001-5.476-4.76-7.13-8.275C.826%2049.247%200%2045.203%200%2040.633c0-4.625.84-8.696%202.519-12.211%201.678-3.516%204.067-6.26%207.167-8.235%203.099-2%206.754-3.002%2010.964-3.002Zm39.42%200c2.174%200%204.35.258%206.523.77a18.077%2018.077%200%200%201%205.988%202.515c1.82%201.189%203.277%202.782%204.363%204.78%201.087%202%201.63%204.5%201.63%207.498v28.519c0%20.994-.8%201.801-1.787%201.801H70.05a1.794%201.794%200%200%201-1.785-1.801V57.03a.207.207%200%200%200-.206-.205.206.206%200%200%200-.178.107c-.648%201.203-1.553%202.346-2.714%203.421-1.168%201.08-2.636%201.957-4.401%202.632C59.026%2063.661%2056.96%2064%2054.57%2064c-2.907%200-5.517-.512-7.826-1.538-2.309-1.054-4.128-2.596-5.459-4.622a11.01%2011.01%200%200%201-.774-1.396%2021.281%2021.281%200%200%200%202.072-6.316c.373-2.26-.69-4.172-2.306-5.23.133-.305.276-.6.436-.881a11.002%2011.002%200%200%201%203.872-4.011c1.657-1%203.52-1.757%205.584-2.27%202.064-.54%204.196-.92%206.396-1.136%202.69-.298%204.866-.55%206.523-.767%201.657-.216%202.851-.57%203.585-1.056.76-.486%201.14-1.244%201.14-2.271v-.201c0-2.19-.653-3.892-1.957-5.108-1.303-1.215-3.204-1.823-5.702-1.823-2.635%200-4.73.566-6.278%201.701-1.066.795-1.89%201.69-2.477%202.685-.433.735-1.224%201.244-2.064%201.125l-6.505-.924c-1.075-.153-1.773-1.236-1.356-2.247.785-1.905%201.862-3.55%203.233-4.934%201.82-1.864%204.036-3.255%206.644-4.174%202.635-.945%205.541-1.42%208.72-1.42ZM115.803.157c1.033-.367%202.304-.098%202.822.875l2.106%203.962c.389.73.242%201.648-.425%202.132a11.872%2011.872%200%200%201-3.352%201.701c-1.614.529-3.524.878-5.73%201.045-2.179.14-4.761.236-7.746.292-3.363.084-6.11.737-8.236%201.962-2.125%201.225-3.764%203.092-4.92%205.598-1.1%202.438-1.82%205.537-2.156%209.294a.287.287%200%200%200%20.282.313.287.287%200%200%200%20.255-.16c1.394-2.789%203.332-4.923%205.814-6.399%202.555-1.503%205.544-2.254%208.961-2.254%203.738%200%207.032.862%209.883%202.587%202.879%201.727%205.128%204.236%206.743%207.522%201.64%203.285%202.446%207.268%202.419%2011.944.027%204.788-.835%208.937-2.584%2012.445-1.748%203.508-4.224%206.221-7.425%208.142-3.202%201.893-6.981%202.84-11.339%202.84-6.591%200-11.825-2.21-15.698-6.638-1.349-1.561-2.455-3.377-3.334-5.441V32.752c0-3.228-.56-6.204-1.842-8.775.87-6.231%202.634-11.171%205.298-14.816%203.954-5.4%209.82-8.17%2017.595-8.31a159.92%20159.92%200%200%201%206.212-.042c1.829.028%203.431-.055%204.803-.25a9.165%209.165%200%200%200%201.594-.402Zm14.935%2017.028c.986%200%201.786.808%201.786%201.802V34.31c0%20.995.8%201.803%201.787%201.803h1.374c.559%200%201.088-.266%201.425-.716l13.143-17.5a1.78%201.78%200%200%201%201.423-.712h8.835c1.478%200%202.315%201.708%201.419%202.893l-14.415%2019.059a1.812%201.812%200%200%200-.014%202.167l14.659%2019.82c.877%201.187.038%202.873-1.43%202.875h-8.957c-.566%200-1.1-.27-1.436-.73l-11.88-16.209a1.781%201.781%200%200%200-1.434-.732h-2.712c-.987%200-1.787.808-1.787%201.803V62.2c0%20.993-.8%201.798-1.786%201.798h-7.522a1.792%201.792%200%200%201-1.786-1.799v-4.656a25.073%2025.073%200%200%200%201.702-2.913c1.795-3.601%202.741-7.675%202.93-12.143l.035-1.937c.023-4.763-.747-9.072-2.45-12.807l-.355-.74a23.7%2023.7%200%200%200-1.862-3.138v-4.879c0-.994.8-1.802%201.786-1.802h7.522Zm50.761%200c2.173%200%204.348.258%206.522.77a18.086%2018.077%200%200%201%205.988%202.515c1.82%201.189%203.276%202.782%204.363%204.78%201.086%202%201.629%204.5%201.629%207.498v28.519c0%20.994-.799%201.801-1.785%201.801h-6.738a1.795%201.795%200%200%201-1.787-1.801V57.03a.207.207%200%200%200-.206-.205.205.205%200%200%200-.177.107c-.649%201.203-1.554%202.346-2.714%203.421-1.168%201.08-2.636%201.957-4.402%202.632-1.738.676-3.804%201.014-6.194%201.014-2.907%200-5.517-.512-7.826-1.538a13.743%2013.743%200%200%201-2.173-1.247%205.399%205.399%200%200%200-.977-2.243l-4.01-5.424c-.196-1-.297-2.07-.297-3.208%200-2.54.476-4.648%201.427-6.323a10.99%2010.99%200%200%201%203.871-4.011c1.657-1%203.519-1.757%205.584-2.27a40.979%2040.979%200%200%201%206.396-1.136c2.69-.298%204.865-.55%206.523-.767%201.656-.216%202.851-.57%203.585-1.056.76-.486%201.14-1.244%201.14-2.271v-.201c0-2.189-.652-3.892-1.956-5.108-1.304-1.215-3.205-1.823-5.703-1.823-2.635%200-4.729.566-6.277%201.701-1.066.795-1.891%201.69-2.477%202.685-.433.735-1.225%201.244-2.065%201.125l-6.504-.924c-1.075-.153-1.774-1.236-1.358-2.247.786-1.905%201.863-3.55%203.234-4.934%201.82-1.864%204.036-3.255%206.644-4.174%202.635-.945%205.542-1.42%208.72-1.42ZM67.897%2043.405c0-.78-.974-1.357-1.712-1.129-.788.216-1.685.419-2.69.608a62.031%2062.031%200%200%201-2.974.486%2094.18%2094.18%200%200%201-2.488.323c-1.603.216-3.044.58-4.321%201.094-1.25.486-2.241%201.163-2.975%202.027-.733.865-1.098%201.987-1.098%203.365%200%201.972.72%203.459%202.159%204.459%201.44%201%203.275%201.5%205.503%201.5%202.172%200%204.047-.42%205.623-1.257%201.575-.865%202.8-2.002%203.669-3.407a8.823%208.823%200%200%200%201.304-4.66v-3.41Zm121.428%200c0-.78-.974-1.357-1.713-1.129-.787.216-1.684.419-2.688.608a61.94%2061.94%200%200%201-2.976.486c-.95.135-1.78.242-2.486.323-1.603.216-3.044.58-4.321%201.094-1.25.486-2.243%201.163-2.976%202.027-.733.865-1.099%201.987-1.099%203.365.001%201.972.72%203.459%202.16%204.459%201.44%201%203.276%201.5%205.503%201.5%202.173%200%204.047-.42%205.623-1.257%201.575-.865%202.799-2.002%203.669-3.407a8.829%208.829%200%200%200%201.304-4.66v-3.41Zm-88.23-16.2c-1.64.001-3.107.306-4.398.918-1.291.585-2.41%201.462-3.352%202.632-.915%201.17-1.612%202.604-2.096%204.302-.484%201.699-.74%203.635-.768%205.806-.026%204.37.916%207.851%202.826%2010.44%201.91%202.59%204.547%203.897%207.91%203.924%202.178-.028%204.048-.611%205.608-1.752%201.587-1.17%202.812-2.826%203.673-4.97.807-2.01%201.225-4.374%201.252-7.094v-1.086c-.027-2.664-.445-4.949-1.252-6.854-.861-2.06-2.086-3.62-3.673-4.678-1.587-1.058-3.498-1.587-5.73-1.587Z%22%2F%3E%3C%2Fsvg%3E")`,ue={maskImage:$,WebkitMaskImage:$},de=()=>(0,G.jsx)(`svg`,{width:`20`,height:`20`,viewBox:`-1.75 -1.75 17.5 17.5`,fill:`none`,"aria-hidden":`true`,children:(0,G.jsx)(`path`,{fill:`currentColor`,d:`M7 .75c.69 0 1.25.56 1.25 1.25v3.75H12a1.25 1.25 0 1 1 0 2.5H8.25V12a1.25 1.25 0 1 1-2.5 0V8.25H2a1.25 1.25 0 1 1 0-2.5h3.75V2c0-.69.56-1.25 1.25-1.25Z`})}),fe=()=>(0,G.jsxs)(`svg`,{width:`20`,height:`20`,viewBox:`0 0 24 24`,fill:`none`,"aria-hidden":`true`,children:[(0,G.jsx)(`path`,{fill:`currentColor`,fillRule:`evenodd`,clipRule:`evenodd`,opacity:`.4`,d:`M6.425 5.967a1 1 0 0 1-.675 1.242C4.162 7.68 3.67 8 3.43 8.415c-.154.266-.23.615-.143 1.308.091.721.337 1.652.703 3.023l1.012 3.8c.365 1.37.615 2.3.895 2.971.268.644.507.907.77 1.058.265.152.616.227 1.313.136.725-.095 1.66-.345 3.037-.716l.473-.127a1 1 0 1 1 .52 1.93l-.54.147c-1.292.348-2.357.635-3.23.749-.918.12-1.772.073-2.568-.384-.797-.458-1.267-1.171-1.622-2.023-.337-.81-.62-1.873-.963-3.158L2.04 13.193c-.343-1.285-.626-2.347-.736-3.219-.116-.916-.064-1.768.397-2.563.686-1.182 1.954-1.668 3.482-2.12a1 1 0 0 1 1.243.676Z`}),(0,G.jsx)(`path`,{fill:`currentColor`,d:`M10.582 1.66c.73-.419 1.522-.472 2.412-.358.858.11 1.91.39 3.215.738l1.06.283c1.306.347 2.358.628 3.156.96.828.343 1.488.783 1.911 1.51.423.729.476 1.518.361 2.406-.11.853-.392 1.9-.742 3.198L20.904 14.3c-.35 1.297-.633 2.345-.966 3.139-.347.825-.79 1.48-1.52 1.9-.73.42-1.521.473-2.412.359-.858-.11-1.91-.39-3.215-.739l-1.06-.282c-1.306-.348-2.358-.629-3.157-.96-.828-.344-1.487-.783-1.91-1.51-.423-.73-.476-1.519-.361-2.406.11-.854.393-1.901.742-3.198L8.097 6.7c.35-1.297.631-2.345.965-3.14.346-.825.79-1.48 1.52-1.9Zm1.469 8.428a.75.75 0 0 0-.387 1.45l2.387.635a.75.75 0 0 0 .387-1.449l-2.387-.636Zm1.023-3.797a.75.75 0 0 0-.386 1.45l4.773 1.271a.75.75 0 1 0 .386-1.45l-4.773-1.27Z`})]}),pe=()=>(0,G.jsx)(`svg`,{width:`20`,height:`20`,viewBox:`0 0 24 24`,fill:`none`,"aria-hidden":`true`,children:(0,G.jsx)(`path`,{d:`M3 12h18m-8.7-8.7 8.7 8.7-8.7 8.7`,stroke:`currentColor`,strokeWidth:`1.8`,strokeLinecap:`round`,strokeLinejoin:`round`})}),me=()=>(0,G.jsxs)(`svg`,{width:`20`,height:`20`,viewBox:`-2 -2 20 20`,fill:`none`,"aria-hidden":`true`,children:[(0,G.jsx)(`path`,{fill:`currentColor`,fillOpacity:`.3`,d:`M13.923 7.462c0 1.784-.723 3.4-1.893 4.569a6.462 6.462 0 1 1 1.893-4.569Z`}),(0,G.jsx)(`path`,{stroke:`currentColor`,strokeLinecap:`round`,strokeWidth:`2`,d:`M13.923 7.462a6.462 6.462 0 0 1-6.461 6.461m6.461-6.461a6.462 6.462 0 1 0-6.461 6.461m6.461-6.461c0 1.784-.723 3.4-1.893 4.569m-4.568 1.892c1.784 0 3.4-.723 4.569-1.893m0 0L15 15`})]}),he=()=>(0,G.jsxs)(`svg`,{width:`16`,height:`16`,viewBox:`0 0 16 16`,fill:`none`,"aria-hidden":`true`,children:[(0,G.jsx)(`path`,{fill:`currentColor`,opacity:`.4`,d:`M8.05 0c1.569 0 2.816 0 3.8.12 1.014.123 1.853.382 2.547.975.182.156.352.325.508.508.593.694.852 1.532.975 2.546.12.985.12 2.334.12 3.902s0 2.815-.12 3.8c-.123 1.013-.383 1.852-.976 2.546a4.566 4.566 0 0 1-.507.508c-.694.593-1.533.852-2.546.975-.986.12-2.334.12-3.902.12s-2.815 0-3.8-.12c-1.014-.123-1.852-.383-2.547-.976a4.568 4.568 0 0 1-.507-.507c-.593-.694-.852-1.533-.975-2.546C0 10.866 0 9.619 0 8.05c0-1.568 0-2.917.12-3.902.123-1.014.382-1.852.975-2.546a4.57 4.57 0 0 1 .507-.508C2.297.502 3.135.243 4.15.12 5.134 0 6.483 0 8.051 0Z`}),(0,G.jsx)(`path`,{fill:`currentColor`,d:`M1.633 11.667c.105.865.302 1.366.621 1.74.104.122.217.235.338.339.375.32.876.516 1.741.621.883.108 2.037.109 3.667.109s2.785-.001 3.667-.109c.865-.105 1.367-.302 1.74-.621.122-.104.235-.217.34-.338.319-.375.516-.876.62-1.741a13.4 13.4 0 0 0 .082-1.12l-1.352-1.353a1.413 1.413 0 0 0-1.999 0l-1.537 1.537-3.098-3.098a1.413 1.413 0 0 0-1.999 0l-2.913 2.913c.016.42.041.79.082 1.121Z`}),(0,G.jsx)(`path`,{fill:`currentColor`,fillRule:`evenodd`,clipRule:`evenodd`,d:`M9.756 4.487a.976.976 0 1 1 1.951 0 .976.976 0 0 1-1.95 0Z`})]});function ge({webSearch:e,imageGen:t,onWebSearch:n,onImageGen:i}){let[a,o]=(0,r.useState)(!1),s=(0,r.useRef)(null),c=(0,r.useRef)(null),l=a||e||t;(0,r.useEffect)(()=>{if(!a)return;let e=e=>{s.current?.contains(e.target)||o(!1)},t=e=>{e.key===`Escape`&&(o(!1),c.current?.focus())};return document.addEventListener(`pointerdown`,e,!0),document.addEventListener(`keydown`,t),()=>{document.removeEventListener(`pointerdown`,e,!0),document.removeEventListener(`keydown`,t)}},[a]);let u=[{id:`search`,label:`Web search`,Icon:me,active:e,toggle:n},{id:`image`,label:`Image generation`,Icon:he,active:t,toggle:i}];return(0,G.jsxs)(`div`,{ref:s,className:W.functions,onBlur:e=>{let t=e.relatedTarget;t&&!s.current?.contains(t)&&o(!1)},children:[(0,G.jsx)(`button`,{ref:c,type:`button`,className:`${W.gb} ${W.gbIcon}`,"data-active":l||void 0,"aria-label":`Functions`,"aria-haspopup":`menu`,"aria-expanded":a,onClick:()=>o(e=>!e),children:(0,G.jsx)(`span`,{className:W.gbFace,children:(0,G.jsx)(`span`,{className:W.plus,"data-open":a||void 0,children:(0,G.jsx)(de,{})})})}),a&&(0,G.jsx)(`div`,{className:W.menu,role:`menu`,"aria-label":`Functions`,children:u.map(({id:e,label:t,Icon:n,active:r,toggle:i})=>(0,G.jsxs)(`button`,{type:`button`,role:`menuitemcheckbox`,"aria-checked":r,className:W.menuItem,"data-active":r||void 0,onClick:i,children:[(0,G.jsx)(`span`,{className:W.menuIcon,children:(0,G.jsx)(n,{})}),(0,G.jsx)(`span`,{className:W.menuLabel,children:t}),r&&(0,G.jsx)(`span`,{className:W.menuDot,"aria-hidden":`true`})]},e))})]})}function _e({draft:e}){let[t,n]=(0,r.useState)(``),[i,a]=(0,r.useState)(`idle`),[o,s]=(0,r.useState)(!1),[c,l]=(0,r.useState)(!1),[u,d]=(0,r.useState)(!1),[f,p]=(0,r.useState)(0),m=(0,r.useRef)(null),h=(0,r.useRef)(!1),g=(0,r.useRef)(void 0),_=u?`Describe the image you want to generate`:`Ask anything`;(0,r.useEffect)(()=>{let e=m.current;e&&(e.style.height=`auto`,e.style.height=`${e.scrollHeight}px`)},[t,_]);let v=(0,r.useRef)(0);(0,r.useEffect)(()=>()=>{window.clearTimeout(g.current),cancelAnimationFrame(v.current)},[]),(0,r.useEffect)(()=>{if(!e)return;n(e.text),e.image&&d(!0);let t=m.current;if(!t)return;t.focus();let r=requestAnimationFrame(()=>t.setSelectionRange(e.text.length,e.text.length));return()=>cancelAnimationFrame(r)},[e]);let y=t.trim().length>0,b=()=>{y&&(n(``),a(`idle`),window.clearTimeout(g.current),cancelAnimationFrame(v.current),v.current=requestAnimationFrame(()=>a(`submit`)),g.current=window.setTimeout(()=>a(`idle`),X),m.current?.focus())};return(0,G.jsxs)(`div`,{className:W.composer,"data-anim":i,"data-image":u||void 0,children:[(0,G.jsx)(`div`,{className:W.glow,"aria-hidden":`true`}),(0,G.jsx)(`textarea`,{ref:m,className:W.field,rows:1,value:t,placeholder:_,"aria-label":`Message`,onChange:e=>n(e.target.value),onKeyDown:e=>{e.key!==`Enter`||e.shiftKey||h.current||e.nativeEvent.isComposing||(e.preventDefault(),b())},onCompositionStart:()=>h.current=!0,onCompositionEnd:()=>h.current=!1}),(0,G.jsxs)(`div`,{className:W.toolbar,"data-multichat":o||void 0,children:[(0,G.jsxs)(`div`,{className:W.toolbarStart,children:[(0,G.jsx)(ge,{webSearch:c,imageGen:u,onWebSearch:()=>l(e=>!e),onImageGen:()=>d(e=>!e)}),(0,G.jsx)(`button`,{type:`button`,className:`${W.gb} ${W.gbCollapsible}`,"data-active":o||void 0,"aria-label":`Multichat`,"aria-pressed":o,onClick:()=>s(e=>!e),children:(0,G.jsxs)(`span`,{className:W.gbFace,children:[(0,G.jsx)(fe,{}),(0,G.jsx)(`span`,{className:W.gbLabel,children:`Multichat`})]})})]}),!o&&(0,G.jsx)(`div`,{className:W.toolbarModel,children:(0,G.jsx)(`button`,{type:`button`,className:`${W.gb} ${W.gbWide}`,"aria-label":`Model: ${Z[f]}. Switch model`,onClick:()=>p(e=>(e+1)%Z.length),children:(0,G.jsx)(`span`,{className:W.gbFace,children:(0,G.jsx)(`span`,{className:W.gbTruncate,children:Z[f]})})})}),(0,G.jsx)(`div`,{className:W.toolbarEnd,children:(0,G.jsx)(`button`,{type:`button`,className:`${W.gb} ${W.gbIcon}`,"data-active":y||void 0,"data-soft-disabled":!y||void 0,"aria-label":`Send message`,"aria-disabled":!y,onClick:b,children:(0,G.jsx)(`span`,{className:W.gbFace,children:(0,G.jsx)(pe,{})})})})]})]})}function ve({composer:e=!0}){let t=(0,r.useRef)(null),n=(0,r.useRef)(null),[i,a]=(0,r.useState)(!1),[o,s]=(0,r.useState)(null);(0,r.useEffect)(()=>{let r=t.current,i=n.current;if(!r||!i||typeof window.matchMedia!=`function`)return;let o=e?r:r.offsetParent??r.parentElement??r,s=[J,M].map(e=>window.matchMedia(e)),c=null,l=!1,u=()=>{c?.destroy(),a(!1),c=N(window)?B(i,{pointerTarget:o,findCalm:()=>Array.from(o.querySelectorAll(Y)),still:window.matchMedia(J).matches,onReady:()=>a(!0),onLost:()=>a(!1),onCalm:()=>a(!1),onWake:()=>a(!0)}):null,c?.setActive(l)},d=new IntersectionObserver(([e])=>{l=!!e?.isIntersecting,c?.setActive(l)});return u(),d.observe(r),s.forEach(e=>e.addEventListener(`change`,u)),()=>{s.forEach(e=>e.removeEventListener(`change`,u)),d.disconnect(),c?.destroy()}},[e]);let c=(0,r.useCallback)(e=>{let{body:t,image:n=!1}=U[e];s(e=>({text:t,image:n,nonce:(e?.nonce??0)+1}))},[]);return(0,G.jsxs)(`div`,{ref:t,className:W.root,"data-mode":e?`composer`:`bare`,"data-ready":i||void 0,children:[(0,G.jsx)(`div`,{className:W.still,style:q,"aria-hidden":`true`}),(0,G.jsx)(`div`,{ref:n,className:W.host,"aria-hidden":`true`}),e&&(0,G.jsx)(`div`,{className:W.stage,children:(0,G.jsxs)(`div`,{className:W.column,children:[(0,G.jsxs)(`div`,{className:W.hero,children:[(0,G.jsx)(`div`,{className:W.logo,style:ue,role:`img`,"aria-label":`Sabka`}),(0,G.jsx)(`p`,{className:W.guide,"data-backdrop-calm":``,children:`Describe the role, context, task and limits, and the model gets it right the first time`})]}),(0,G.jsx)(`div`,{className:W.chips,role:`group`,"aria-label":`Prompt ideas`,children:(0,G.jsx)(`div`,{className:W.chipRow,children:Q.map(e=>(0,G.jsx)(`button`,{type:`button`,className:W.chip,"data-chip":e.id,onClick:()=>c(e.id),onFocus:e=>e.currentTarget.scrollIntoView({inline:`nearest`,block:`nearest`}),children:e.label},e.id))})}),(0,G.jsx)(_e,{draft:o})]})})]})}export{ve as default};