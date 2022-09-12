attribute vec2 a_pos;
varying vec2 v_uv;
uniform vec3 pos;
uniform mat3 u_mat;

void main() {
  gl_Position = vec4(a_pos * 2. - 1., 0, 1);
  v_uv = a_pos;
}
