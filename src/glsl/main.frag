precision mediump float;
varying vec2 v_uv;
uniform vec4 u_tile;
uniform sampler2D tex;

void main() {
  vec2 uv = (v_uv.xy * u_tile.zw + u_tile.xy) / vec2(16);
  vec4 col = texture2D(tex, uv);

  // if (col == vec4(1., 0., 0., 1.)) {
  //   vec2 uv = (v_uv.xy * vec2(2., 2.) + vec2(0, 14)) / vec2(16, 16);
  //   vec4 col = texture2D(tex, uv);
  //   gl_FragColor = vec4(col.rgb, 1.);
  //   return;
  // }

  if (col.a < 1.) {
    discard;
  }
  gl_FragColor = vec4(vec3(col.rgb), 1.);
}
