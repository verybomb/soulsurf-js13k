attribute vec2 a_pos;
varying vec2 v_uv;
uniform vec2 u_res;
uniform mat3 u_mat;
uniform vec2 u_cam;

void main() {
  vec3 p = u_mat * vec3(a_pos, 1);
  vec4 pos = vec4((p.xy - u_cam)/u_res * 2. - 1., 0, 1);
  gl_Position = pos * vec4(1,-1,1,1);
  v_uv = vec2(a_pos.x, a_pos.y);
}
