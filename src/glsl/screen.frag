// #define DEBUG false
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_map;
uniform sampler2D u_map2;
uniform float u_t;
uniform vec2 u_res;

// curvature
vec2 curve(vec2 uv, float c) {
  uv = uv * 2. - 1.;
  vec2 o = abs(uv.yx) / c;
  uv = uv + uv * o * o;
  uv = uv * .5 + .5;
  return uv;
}

// scanline
vec4 sl(float uv, float res, float o) {
  float i = (.5 * sin(uv * res * 6.28) + .5) * .9 + .1;
  return vec4(vec3(pow(i, o)), 1.);
}

vec4 col(sampler2D image) {
  vec2 uv = curve(vec2(v_uv.x, v_uv.y), 3.5);
  vec2 uv2 = curve(vec2(v_uv.x, v_uv.y), 3.7);

  vec4 bc = texture2D(image, uv);

  for (int i = -4; i < 4; i++) {
    float ii = float(i);
    vec4 col2 = texture2D(image, uv2 + vec2(0, ii) / u_res);
    float ss = pow((col2.r+col2.g+col2.b) / 3., .8) * .9 + .1;
    float intensity = (1. - abs(ii) / 4.) * ss;
    bc += col2 * vec4(.2, .1, .7, 1.) * intensity;
  }

  bc *= sl(uv.x, u_res.y, .15);
  bc *= sl(uv.y, u_res.x, .15);

  if (uv.x < .0 || uv.y < .0 || uv.x > 1. || uv.y > 1.) {
    bc *= 0.;
  }
  return bc;
}

void main() {
  gl_FragColor = col(u_map);
}
