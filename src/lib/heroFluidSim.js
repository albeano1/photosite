/**
 * Scalar dye fluid simulation for hero color reveal.
 * Adapted from Pavel Dobryakov's WebGL Fluid Simulation (MIT License).
 * https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
 */

const BASE_VERT = `
  precision highp float;
  attribute vec2 aPosition;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform vec2 texelSize;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

function compileShader(gl, type, source, keywords) {
  let src = source
  if (keywords?.length) {
    keywords.forEach((k) => {
      src = `#define ${k}\n${src}`
    })
  }
  const shader = gl.createShader(type)
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
    return null
  }
  return shader
}

function createGlProgram(gl, fragSource, keywords) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, BASE_VERT)
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSource, keywords)
  if (!vs || !fs) return null
  const program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program))
    return null
  }
  const uniforms = {}
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i)
    uniforms[info.name] = gl.getUniformLocation(program, info.name)
  }
  return { program, uniforms }
}

function getExtensions(gl) {
  const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext
  let halfFloatExt = null
  let supportLinearFiltering = gl.getExtension('OES_texture_float_linear')

  let halfFloatTexType = gl.FLOAT
  let formatRGBA = { internalFormat: gl.RGBA, format: gl.RGBA }
  let formatRG = { internalFormat: gl.RGBA, format: gl.RGBA }
  let formatR = { internalFormat: gl.RGBA, format: gl.RGBA }

  if (isWebGL2) {
    gl.getExtension('EXT_color_buffer_float')
    supportLinearFiltering = gl.getExtension('OES_texture_float_linear') || supportLinearFiltering
    halfFloatTexType = gl.HALF_FLOAT
    formatRGBA = { internalFormat: gl.RGBA16F, format: gl.RGBA }
    formatRG = { internalFormat: gl.RG16F, format: gl.RG }
    formatR = { internalFormat: gl.R16F, format: gl.RED }
  } else {
    halfFloatExt = gl.getExtension('OES_texture_half_float')
    if (halfFloatExt) {
      halfFloatTexType = halfFloatExt.HALF_FLOAT_OES
      supportLinearFiltering =
        gl.getExtension('OES_texture_half_float_linear') || supportLinearFiltering
    }
  }

  return {
    isWebGL2,
    halfFloatTexType,
    supportLinearFiltering: !!supportLinearFiltering,
    formatRGBA,
    formatRG,
    formatR,
  }
}

const SHADERS = {
  splat: `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;
    void main() {
      vec2 p = vUv - point;
      p.x *= aspectRatio;
      vec3 splat = exp(-dot(p, p) / radius) * color;
      vec3 base = texture2D(uTarget, vUv).xyz;
      gl_FragColor = vec4(base + splat, 1.0);
    }`,
  advect: `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform vec2 dyeTexelSize;
    uniform float dt;
    uniform float dissipation;
    void main() {
      vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
      vec4 result = texture2D(uSource, coord);
      float decay = 1.0 + dissipation * dt;
      gl_FragColor = result / decay;
    }`,
  divergence: `
    precision mediump float;
    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;
    void main() {
      float L = texture2D(uVelocity, vL).x;
      float R = texture2D(uVelocity, vR).x;
      float T = texture2D(uVelocity, vT).y;
      float B = texture2D(uVelocity, vB).y;
      vec2 C = texture2D(uVelocity, vUv).xy;
      if (vL.x < 0.0) L = -C.x;
      if (vR.x > 1.0) R = -C.x;
      if (vT.y > 1.0) T = -C.y;
      if (vB.y < 0.0) B = -C.y;
      float div = 0.5 * (R - L + T - B);
      gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }`,
  curl: `
    precision mediump float;
    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;
    void main() {
      float L = texture2D(uVelocity, vL).y;
      float R = texture2D(uVelocity, vR).y;
      float T = texture2D(uVelocity, vT).x;
      float B = texture2D(uVelocity, vB).x;
      float vorticity = R - L - T + B;
      gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
    }`,
  vorticity: `
    precision highp float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;
    void main() {
      float L = texture2D(uCurl, vL).x;
      float R = texture2D(uCurl, vR).x;
      float T = texture2D(uCurl, vT).x;
      float B = texture2D(uCurl, vB).x;
      float C = texture2D(uCurl, vUv).x;
      vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
      force /= length(force) + 0.0001;
      force *= curl * C;
      force.y *= -1.0;
      vec2 velocity = texture2D(uVelocity, vUv).xy;
      velocity += force * dt;
      velocity = min(max(velocity, -1000.0), 1000.0);
      gl_FragColor = vec4(velocity, 0.0, 1.0);
    }`,
  pressure: `
    precision mediump float;
    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;
    void main() {
      float L = texture2D(uPressure, vL).x;
      float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x;
      float B = texture2D(uPressure, vB).x;
      float divergence = texture2D(uDivergence, vUv).x;
      float pressure = (L + R + B + T - divergence) * 0.25;
      gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }`,
  gradientSubtract: `
    precision mediump float;
    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;
    void main() {
      float L = texture2D(uPressure, vL).x;
      float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x;
      float B = texture2D(uPressure, vB).x;
      vec2 velocity = texture2D(uVelocity, vUv).xy;
      velocity.xy -= vec2(R - L, T - B);
      gl_FragColor = vec4(velocity, 0.0, 1.0);
    }`,
  clear: `
    precision mediump float;
    varying highp vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;
    void main() {
      gl_FragColor = value * texture2D(uTexture, vUv);
    }`,
}

function createFbo(gl, w, h, internalFormat, format, type, filter) {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null)
  const fbo = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  gl.viewport(0, 0, w, h)
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  return {
    texture,
    fbo,
    width: w,
    height: h,
    texelSizeX: 1 / w,
    texelSizeY: 1 / h,
    attach(id) {
      gl.activeTexture(gl.TEXTURE0 + id)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      return id
    },
  }
}

function createDoubleFbo(gl, w, h, internalFormat, format, type, filter) {
  let read = createFbo(gl, w, h, internalFormat, format, type, filter)
  let write = createFbo(gl, w, h, internalFormat, format, type, filter)
  return {
    width: w,
    height: h,
    get texelSizeX() {
      return read.texelSizeX
    },
    get texelSizeY() {
      return read.texelSizeY
    },
    get read() {
      return read
    },
    get write() {
      return write
    },
    swap() {
      const t = read
      read = write
      write = t
    },
  }
}

export class HeroFluidSim {
  constructor(gl, width, height) {
    this.gl = gl
    this.ext = getExtensions(gl)
    this.aspect = width / Math.max(height, 1)

    this.config = {
      simResolution: 128,
      dyeResolution: 512,
      densityDissipation: 0.3,
      velocityDissipation: 0.34,
      pressure: 0.82,
      pressureIterations: 16,
      curl: 18,
      splatRadius: 0.09,
      dyeSplatRadius: 0.055,
      splatForce: 4200,
    }

    this.programs = {}
    Object.entries(SHADERS).forEach(([key, src]) => {
      this.programs[key] = createGlProgram(gl, src)
    })

    this.quadBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
      gl.STATIC_DRAW
    )
    this.indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array([0, 1, 2, 0, 2, 3]),
      gl.STATIC_DRAW
    )

    this.dye = null
    this.velocity = null
    this.divergence = null
    this.curl = null
    this.pressure = null
    this.resize(width, height)
  }

  getDyeTexture() {
    return this.dye?.read.texture ?? null
  }

  resize(canvasWidth, canvasHeight) {
    this.aspect = canvasWidth / Math.max(canvasHeight, 1)
    const sim = this.getSimSize(this.config.simResolution, canvasWidth, canvasHeight)
    const dye = this.getSimSize(this.config.dyeResolution, canvasWidth, canvasHeight)
    const { gl, ext } = this
    const filter = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST
    const type = ext.halfFloatTexType

    this.velocity = this.ensureDouble(
      this.velocity,
      sim.w,
      sim.h,
      ext.formatRG.internalFormat,
      ext.formatRG.format,
      type,
      filter
    )
    this.dye = this.ensureDouble(
      this.dye,
      dye.w,
      dye.h,
      ext.formatRGBA.internalFormat,
      ext.formatRGBA.format,
      type,
      filter
    )
    this.divergence = this.ensureSingle(
      this.divergence,
      sim.w,
      sim.h,
      ext.formatR.internalFormat,
      ext.formatR.format,
      type,
      gl.NEAREST
    )
    this.curl = this.ensureSingle(
      this.curl,
      sim.w,
      sim.h,
      ext.formatR.internalFormat,
      ext.formatR.format,
      type,
      gl.NEAREST
    )
    this.pressure = this.ensureDouble(
      this.pressure,
      sim.w,
      sim.h,
      ext.formatR.internalFormat,
      ext.formatR.format,
      type,
      gl.NEAREST
    )
  }

  getSimSize(base, w, h) {
    const aspect = w / Math.max(h, 1)
    let rw = base
    let rh = base
    if (aspect > 1) rh = Math.round(base / aspect)
    else rw = Math.round(base * aspect)
    return { w: rw, h: rh }
  }

  ensureSingle(fbo, w, h, internalFormat, format, type, filter) {
    if (fbo && fbo.width === w && fbo.height === h) return fbo
    return createFbo(this.gl, w, h, internalFormat, format, type, filter)
  }

  ensureDouble(fbo, w, h, internalFormat, format, type, filter) {
    if (fbo && fbo.width === w && fbo.height === h) return fbo
    return createDoubleFbo(this.gl, w, h, internalFormat, format, type, filter)
  }

  bindProgram(key) {
    const p = this.programs[key]
    this.gl.useProgram(p.program)
    const pos = this.gl.getAttribLocation(p.program, 'aPosition')
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer)
    this.gl.vertexAttribPointer(pos, 2, this.gl.FLOAT, false, 0, 0)
    this.gl.enableVertexAttribArray(pos)
    return p
  }

  blit(target) {
    const gl = this.gl
    if (target) {
      gl.viewport(0, 0, target.width, target.height)
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo)
    }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
  }

  correctRadius(r) {
    return this.aspect > 1 ? r * this.aspect : r
  }

  splat(x, y, deltaX, deltaY, dyeAmount = 0.55, opts = {}) {
    const { gl, config } = this
    const splatRadius = opts.splatRadius ?? config.splatRadius
    const dyeSplatRadius = opts.dyeSplatRadius ?? config.dyeSplatRadius
    const dx = deltaX * config.splatForce
    const dy = deltaY * config.splatForce
    const radius = this.correctRadius(splatRadius / 100)

    let p = this.bindProgram('splat')
    gl.uniform2f(p.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY)
    gl.uniform1i(p.uniforms.uTarget, this.velocity.read.attach(0))
    gl.uniform1f(p.uniforms.aspectRatio, this.aspect)
    gl.uniform2f(p.uniforms.point, x, y)
    gl.uniform3f(p.uniforms.color, dx, dy, 0)
    gl.uniform1f(p.uniforms.radius, radius)
    this.blit(this.velocity.write)
    this.velocity.swap()

    p = this.bindProgram('splat')
    gl.uniform1i(p.uniforms.uTarget, this.dye.read.attach(0))
    gl.uniform3f(p.uniforms.color, dyeAmount, dyeAmount, dyeAmount)
    gl.uniform1f(p.uniforms.radius, this.correctRadius(dyeSplatRadius / 100))
    this.blit(this.dye.write)
    this.dye.swap()
  }

  splatCursorTrail(x, y, deltaX, deltaY, dyeAmount = 0.55, opts = {}) {
    const move = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    if (move < 0.00001) {
      this.splat(x, y, deltaX, deltaY, dyeAmount, opts)
      return
    }

    const dirX = deltaX / move
    const dirY = deltaY / move
    const steps = opts.trailSteps ?? 6
    const trailLength = opts.trailLength ?? 6
    const baseSplatRadius = opts.splatRadius ?? this.config.splatRadius
    const baseDyeRadius = opts.dyeSplatRadius ?? this.config.dyeSplatRadius

    for (let i = 0; i < steps; i++) {
      const t = i / Math.max(1, steps - 1)
      const taper = Math.pow(1 - t, 1.65)
      const behind = move * t * trailLength + t * 0.007
      const velBoost = 0.45 + taper * 0.35

      this.splat(
        x - dirX * behind,
        y - dirY * behind,
        deltaX * velBoost,
        deltaY * velBoost,
        dyeAmount * taper * taper,
        {
          splatRadius: baseSplatRadius * (0.3 + 0.7 * taper),
          dyeSplatRadius: baseDyeRadius * (0.25 + 0.75 * taper),
        }
      )
    }
  }

  step(dt) {
    const { gl, config } = this
    gl.disable(gl.BLEND)

    let p = this.bindProgram('curl')
    gl.uniform2f(p.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY)
    gl.uniform1i(p.uniforms.uVelocity, this.velocity.read.attach(0))
    this.blit(this.curl)

    p = this.bindProgram('vorticity')
    gl.uniform2f(p.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY)
    gl.uniform1i(p.uniforms.uVelocity, this.velocity.read.attach(0))
    gl.uniform1i(p.uniforms.uCurl, this.curl.attach(1))
    gl.uniform1f(p.uniforms.curl, config.curl)
    gl.uniform1f(p.uniforms.dt, dt)
    this.blit(this.velocity.write)
    this.velocity.swap()

    p = this.bindProgram('divergence')
    gl.uniform2f(p.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY)
    gl.uniform1i(p.uniforms.uVelocity, this.velocity.read.attach(0))
    this.blit(this.divergence)

    p = this.bindProgram('clear')
    gl.uniform1i(p.uniforms.uTexture, this.pressure.read.attach(0))
    gl.uniform1f(p.uniforms.value, config.pressure)
    this.blit(this.pressure.write)
    this.pressure.swap()

    p = this.bindProgram('pressure')
    gl.uniform2f(p.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY)
    gl.uniform1i(p.uniforms.uDivergence, this.divergence.attach(0))
    for (let i = 0; i < config.pressureIterations; i++) {
      gl.uniform1i(p.uniforms.uPressure, this.pressure.read.attach(1))
      this.blit(this.pressure.write)
      this.pressure.swap()
    }

    p = this.bindProgram('gradientSubtract')
    gl.uniform2f(p.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY)
    gl.uniform1i(p.uniforms.uPressure, this.pressure.read.attach(0))
    gl.uniform1i(p.uniforms.uVelocity, this.velocity.read.attach(1))
    this.blit(this.velocity.write)
    this.velocity.swap()

    p = this.bindProgram('advect')
    gl.uniform2f(p.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY)
    gl.uniform2f(p.uniforms.dyeTexelSize, this.velocity.texelSizeX, this.velocity.texelSizeY)
    const velId = this.velocity.read.attach(0)
    gl.uniform1i(p.uniforms.uVelocity, velId)
    gl.uniform1i(p.uniforms.uSource, velId)
    gl.uniform1f(p.uniforms.dt, dt)
    gl.uniform1f(p.uniforms.dissipation, config.velocityDissipation)
    this.blit(this.velocity.write)
    this.velocity.swap()

    gl.uniform2f(p.uniforms.dyeTexelSize, this.dye.texelSizeX, this.dye.texelSizeY)
    gl.uniform1i(p.uniforms.uVelocity, this.velocity.read.attach(0))
    gl.uniform1i(p.uniforms.uSource, this.dye.read.attach(1))
    gl.uniform1f(p.uniforms.dissipation, config.densityDissipation)
    this.blit(this.dye.write)
    this.dye.swap()
  }

  destroy() {
    // FBOs released with context
    this.dye = null
    this.velocity = null
  }
}
