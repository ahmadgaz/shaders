const canvas = document.getElementById("webglCanvas");
const gl = canvas.getContext("webgl");

if (!gl) {
  console.error("WebGL not supported");
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

gl.clearColor(0.39, 0.58, 0.93, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform vec2 u_pos;
  uniform float u_time;
  vec4 red() {
    return vec4(1.0, 0.0, 0.0, 1.0);
  }
  float cap(float x) {
    return min(max(x, 0.0), 1.0);
  }
  void main() {
    float distanceToMouse = distance(gl_FragCoord.xy, u_pos);
    float intensity = cap(distanceToMouse * 0.01) * abs(sin(u_time));
    gl_FragColor = vec4(1.0 - intensity/2.0, 0.0, 0.0 + intensity, 1.0);
  }
`;

function compileShader(source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Error compiling shader", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  console.error("Error linking program", gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}
gl.useProgram(program);

const vertices = new Float32Array([-1, -1, -1, 0, 0, -1, 1, 1, 0, 1, 1, 0]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// Get the attribute location
const a_position = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(a_position);
gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

// Get the uniform location
const u_pos = gl.getUniformLocation(program, "u_pos");
canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = rect.height - (event.clientY - rect.top);
  gl.uniform2f(u_pos, x, y);
});

// Get the uniform time
const u_time = gl.getUniformLocation(program, "u_time");
const startTime = Date.now();

function render() {
  // Resize the canvas to the window size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Set the time uniform
  const duration = Date.now() - startTime;
  gl.uniform1f(u_time, duration / 1000);

  // Clear the canvas
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  requestAnimationFrame(render);
}

render();
