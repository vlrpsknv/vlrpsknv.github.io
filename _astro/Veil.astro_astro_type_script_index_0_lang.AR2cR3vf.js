function e(e,t,n){let r=e.createShader(t);return r?(e.shaderSource(r,n),e.compileShader(r),e.getShaderParameter(r,e.COMPILE_STATUS)?r:(e.deleteShader(r),null)):null}function t(t,n){let r=t.getContext(`webgl2`,{alpha:!1,antialias:!1,depth:!1,stencil:!1,powerPreference:`low-power`});if(!r)return null;let i=null,a={},o=null,s=null;function c(){let t=e(r,r.VERTEX_SHADER,`#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`),n=e(r,r.FRAGMENT_SHADER,`#version 300 es
precision highp float;
uniform vec2 uView;
uniform float uTime;
uniform float uScale;
uniform float uRotation;
uniform vec3 uColor;
uniform vec3 uBase;
uniform vec2 uStep;
out vec4 outColor;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  vec2 r = (e * sin(e * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c) * uv;
}

float silk(vec2 vUv) {
  vec2 uv = rotateUvs(vUv * uScale, uRotation);
  vec2 tex = uv * uScale;
  tex.y += 0.03 * sin(8.0 * tex.x - uTime);
  return 0.6 + 0.4 * sin(5.0 * (tex.x + tex.y + cos(3.0 * tex.x + 5.0 * tex.y) + 0.02 * uTime) + sin(20.0 * (tex.x + tex.y - 0.1 * uTime)));
}

vec3 softClip(vec3 c) {
  vec3 over = max(c - 0.75, 0.0);
  return min(c, 0.75) + 0.25 * (1.0 - exp(-over * 4.0));
}

void main() {
  vec2 vUv = gl_FragCoord.xy / uView;
  // Folds keep their proportion on any stage: the pattern is laid out on a 16:10 field
  vec2 coord = vec2((vUv.x - 0.5) * (uView.x / uView.y) / 1.6 + 0.5, vUv.y);
  float pattern = silk(coord);
  float n = clamp((pattern - 0.2) / 0.8, 0.0, 1.0);

  float gx = silk(coord + vec2(uStep.x, 0.0)) - pattern;
  float gy = silk(coord + vec2(0.0, uStep.y)) - pattern;
  vec3 normal = normalize(vec3(-gx * 26.0, -gy * 26.0, 1.0));
  vec3 toLight = normalize(vec3(-0.55, 0.7, 0.85));
  float depth = 0.7;
  float relief = 1.0 + (dot(normal, toLight) - toLight.z) * 1.8 * depth;
  vec3 halfway = normalize(toLight + vec3(0.0, 0.0, 1.0));
  float gloss = pow(max(dot(normal, halfway), 0.0), 48.0) * smoothstep(0.25, 0.85, n);
  float crest = pow(n, 5.0);
  float shine = (gloss * 0.85 + crest * 0.4) * 0.34;

  float floorValue = mix(0.2, 0.03, depth);
  float shade = floorValue + (1.0 - floorValue) * pow(n, 1.0 + 1.4 * depth);
  vec3 tone = mix(uColor, pow(uColor, vec3(1.45)), (1.0 - n) * depth);
  vec3 lit = tone * shade * relief;
  vec3 tint = mix(uColor, vec3(1.0), 0.55);
  vec3 result = clamp(softClip(lit + tint * shine), 0.0, 1.0);

  // The cloth sinks into the page colour towards the edges, most of all above and below
  vec2 p = vUv - 0.5;
  float fall = smoothstep(0.18, 0.56, length(p * vec2(0.82, 1.5)));
  result = mix(result, uBase, fall);

  // Dither against banding in the dark gradients
  float rnd = noise(gl_FragCoord.xy);
  result += (rnd - 0.5) / 96.0;
  outColor = vec4(result, 1.0);
}`);if(i=r.createProgram(),!t||!n||!i||(r.attachShader(i,t),r.attachShader(i,n),r.bindAttribLocation(i,0,`aPosition`),r.linkProgram(i),r.deleteShader(t),r.deleteShader(n),!r.getProgramParameter(i,r.LINK_STATUS)))return!1;a={};for(let e of[`uView`,`uTime`,`uScale`,`uRotation`,`uColor`,`uBase`,`uStep`])a[e]=r.getUniformLocation(i,e);return o=r.createBuffer(),s=r.createVertexArray(),r.bindVertexArray(s),r.bindBuffer(r.ARRAY_BUFFER,o),r.bufferData(r.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),r.STATIC_DRAW),r.enableVertexAttribArray(0),r.vertexAttribPointer(0,2,r.FLOAT,!1,0,0),!0}if(!c())return null;let l=[...n.color],u=0,d=0,f=0,p=!1,m=!1,h=1;function g(){!m&&i&&(r.viewport(0,0,t.width,t.height),r.useProgram(i),r.bindVertexArray(s),r.uniform2f(a.uView,t.width,t.height),r.uniform1f(a.uTime,u),r.uniform1f(a.uScale,1),r.uniform1f(a.uRotation,.35),r.uniform3f(a.uColor,l[0],l[1],l[2]),r.uniform3f(a.uBase,n.base[0],n.base[1],n.base[2]),r.uniform2f(a.uStep,h/t.width,h/t.height),r.drawArrays(r.TRIANGLES,0,3))}function _(e){if(d=0,!p||document.hidden||m)return;let t=f?Math.min(.05,(e-f)/1e3):1/60;f=e,u+=t*.42,g(),d=requestAnimationFrame(_)}function v(){n.still?g():(f=0,!d&&p&&!document.hidden&&!m&&(d=requestAnimationFrame(_)))}function y(){let e=Math.max(1,t.clientWidth),n=Math.max(1,t.clientHeight);h=Math.min(window.devicePixelRatio||1,1.5,1600/e),t.width=Math.max(1,Math.round(e*h)),t.height=Math.max(1,Math.round(n*h)),g()}let b=e=>{e.preventDefault(),m=!0,cancelAnimationFrame(d),d=0},x=()=>{m=!c(),y(),v()},S=()=>v(),C=new ResizeObserver(y);C.observe(t);let w=new IntersectionObserver(e=>{p=e.some(e=>e.isIntersecting),p&&v()});return w.observe(t),t.addEventListener(`webglcontextlost`,b),t.addEventListener(`webglcontextrestored`,x),document.addEventListener(`visibilitychange`,S),y(),{setColor(e){l[0]=e[0],l[1]=e[1],l[2]=e[2],(n.still||!d)&&g()},destroy(){cancelAnimationFrame(d),C.disconnect(),w.disconnect(),t.removeEventListener(`webglcontextlost`,b),t.removeEventListener(`webglcontextrestored`,x),document.removeEventListener(`visibilitychange`,S)}}}function n(e){let t=e.replace(`#`,``),n=t.length===3?[...t].map(e=>e+e).join(``):t,r=parseInt(n,16);return[(r>>16&255)/255,(r>>8&255)/255,(r&255)/255]}var r=window.matchMedia(`(prefers-reduced-motion: reduce)`),i=(e,t,n)=>Math.min(Math.max(e,t),n),a=.5;function o(e){let o=e.querySelector(`[data-veil-stage]`),s=e.querySelector(`[data-veil-track]`),c=e.querySelector(`[data-veil-canvas]`),l=[...e.querySelectorAll(`[data-veil-item]`)],u=e.querySelector(`[data-veil-prev]`),d=e.querySelector(`[data-veil-next]`),f=e.querySelector(`[data-veil-now]`),p=e.querySelector(`[data-veil-name]`),m=e.querySelector(`[data-veil-status]`),h=l.length;if(!o||!s||!h)return;let g=s,_=l.map(e=>n(e.dataset.tone??`#6a4fd8`)),v=e=>[e[0]*a,e[1]*a,e[2]*a],y=c?t(c,{base:n(o.dataset.base??`#0c0a14`),color:v(_[0]),still:r.matches}):null;y&&o.setAttribute(`data-silk`,``);let b=0,x=0,S=0,C=0,w=()=>(h>1?l[1].offsetLeft-l[0].offsetLeft:g.clientWidth)||1;function T(){S=0;let e=i(g.scrollLeft/w(),0,h-1);if(l.forEach((t,n)=>{let r=i(n-e,-2,2);t.style.setProperty(`--d`,r.toFixed(4)),t.style.setProperty(`--a`,Math.min(Math.abs(r),1.5).toFixed(4))}),y){let t=Math.floor(e),n=Math.min(t+1,h-1),r=e-t,i=_[t],a=_[n];y.setColor(v([i[0]+(a[0]-i[0])*r,i[1]+(a[1]-i[1])*r,i[2]+(a[2]-i[2])*r]))}let t=Math.round(e);t!==b&&(l[b]?.removeAttribute(`data-current`),l[t].setAttribute(`data-current`,``),b=t,o.style.setProperty(`--veil-tone`,l[t].dataset.tone??``),f&&(f.textContent=String(t+1).padStart(2,`0`)),p&&(p.textContent=l[t].dataset.name??``),u?.setAttribute(`aria-disabled`,String(t===0)),d?.setAttribute(`aria-disabled`,String(t===h-1)))}function E(){S||=requestAnimationFrame(T)}function D(){T(),b!==x&&m&&(x=b,m.textContent=`Picture ${b+1} of ${h}: ${l[b].dataset.name??``}`)}function O(e){let t=i(e,0,h-1);g.scrollTo({left:t*w(),behavior:r.matches?`instant`:`smooth`})}let k=e=>e?.getAttribute(`aria-disabled`)!==`true`;u?.addEventListener(`click`,()=>k(u)&&O(b-1)),d?.addEventListener(`click`,()=>k(d)&&O(b+1)),g.addEventListener(`keydown`,e=>{if(e.altKey||e.ctrlKey||e.metaKey)return;let t={ArrowLeft:b-1,ArrowRight:b+1,Home:0,End:h-1};e.key in t&&(e.preventDefault(),O(t[e.key]))}),g.addEventListener(`scroll`,()=>{E(),window.clearTimeout(C),C=window.setTimeout(D,160)},{passive:!0}),new ResizeObserver(E).observe(g);let A=null,j=!1,M=0,N=()=>{g.style.removeProperty(`scroll-snap-type`),e.removeAttribute(`data-dragging`)};g.addEventListener(`pointerdown`,e=>{e.pointerType===`mouse`&&e.button===0&&(A={id:e.pointerId,x:e.clientX,left:g.scrollLeft,moved:!1,lastX:e.clientX,lastT:e.timeStamp,v:0})}),g.addEventListener(`pointermove`,t=>{if(!A||t.pointerId!==A.id)return;let n=t.clientX-A.x;if(!A.moved){if(Math.abs(n)<6)return;A.moved=!0,window.clearTimeout(M),g.setPointerCapture(t.pointerId),g.style.scrollSnapType=`none`,e.setAttribute(`data-dragging`,``)}let r=Math.max(t.timeStamp-A.lastT,1);A.v=.7*((t.clientX-A.lastX)/r)+.3*A.v,A.lastX=t.clientX,A.lastT=t.timeStamp,g.scrollLeft=A.left-n});function P(e){if(!A||e.pointerId!==A.id)return;let{moved:t,v:n,lastT:a}=A;if(A=null,!t)return;j=!0,window.setTimeout(()=>j=!1,0);let o=e.timeStamp-a<100?n*220:0,s=Math.round(g.scrollLeft/w());O(i(Math.round((g.scrollLeft-o)/w()),s-1,s+1)),M=window.setTimeout(N,r.matches?0:700)}g.addEventListener(`pointerup`,P),g.addEventListener(`pointercancel`,P),g.addEventListener(`dragstart`,e=>e.preventDefault()),g.addEventListener(`click`,e=>{if(j){j=!1;return}let t=e.target.closest(`[data-veil-item]`),n=t?l.indexOf(t):-1;n!==-1&&n!==b&&O(n)}),T()}for(let e of document.querySelectorAll(`[data-veil]`))o(e);