precision mediump float;
varying vec2 v_uv;
uniform vec4 u_tile;
uniform sampler2D tex;

void main() {
  vec2 uv = (v_uv.xy * u_tile.zw + u_tile.xy) / vec2(16);
  vec4 col = texture2D(tex, uv);

  if (col.a < 1.) {
    discard;
  }
  gl_FragColor = vec4(vec3(col.rgb), 1.);
}
