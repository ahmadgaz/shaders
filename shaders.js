/**
 * @type {HTMLCanvasElement}
 */
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
  uniform vec2 u_resolution;
  uniform float u_time;
  float cap(float x) {
    return max(min(x, 1.0), 0.0);
  }
  void main() {
    float dist = distance(gl_FragCoord.xy, u_pos);
    float intensity = cap(dist * 0.003) * abs(sin(u_time));

    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 mouse = u_pos / u_resolution;

    uv.x *= u_resolution.x / u_resolution.y;

    vec2 uv0 = uv;

    vec3 finalColor = vec3(0.0);

    for (float i = 0.0; i < 3.0; i++) {
      //uv = mod(uv * 1.5 + mouse, i) - 0.5;
      uv = fract(uv * 1.5 + mouse);

      float d = cos(length(uv - mouse * 2.0)) * exp(-length(uv0));
      d = tan(sin(d * 10.0 + u_time * i)) * 0.1;
      d = abs(d);
      d = 0.04/d;

      vec3 col = vec3(cap(1.0 - intensity/2.0 + uv.x - d), cap(uv.y - d), cap(0.0 + intensity - d));
      //vec3 col = vec3(uv, 0.0);
      finalColor += col;
    }

    gl_FragColor = vec4(finalColor, 1.0);
    // gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
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

const vertices = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1, -1, 1, 1, -1]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// Get the attribute location
const a_position = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(a_position);
gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

// Mouse springing animation
let targetX = 0,
  targetY = 0; // Mouse position
let posX = 0,
  posY = 0; // Circle position
let velocityX = 0,
  velocityY = 0; // Velocities for bounce effect
const damping = 0.1; // How much velocity decreases per frame
const stiffness = 0.01; // Spring stiffness

// Get the uniform location
const u_pos = gl.getUniformLocation(program, "u_pos");
canvas.addEventListener("mousemove", (event) => {
  targetX = event.clientX;
  targetY = event.clientY;
});

// Get the uniform time
const u_time = gl.getUniformLocation(program, "u_time");
const startTime = Date.now();

// Get the uniform resolution
const u_resolution = gl.getUniformLocation(program, "u_resolution");

function render() {
  // Calculate spring force
  const forceX = (targetX - posX) * stiffness;
  const forceY = (targetY - posY) * stiffness;

  // Apply force to velocity
  velocityX += forceX;
  velocityY += forceY;

  // Apply damping to velocity
  velocityX *= 1 - damping;
  velocityY *= 1 - damping;

  // Update position
  posX += velocityX;
  posY += velocityY;

  // Set the mouse position uniform
  const rect = canvas.getBoundingClientRect();
  const x = posX - rect.left;
  const y = rect.height - (posY - rect.top);
  gl.uniform2f(u_pos, x, y);

  // Resize the canvas to the window size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.uniform2f(u_resolution, gl.canvas.width, gl.canvas.height);

  // Set the time uniform
  const duration = Date.now() - startTime;
  gl.uniform1f(u_time, duration / 1000);

  // Clear the canvas
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  requestAnimationFrame(render);
}

render();
