import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { HeroFluidSim } from '../lib/heroFluidSim'

const VERTEX = `
  attribute vec2 aPosition;
  attribute vec2 aUv;
  varying vec2 vUv;
  void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

const FRAGMENT = `
  precision mediump float;
  uniform sampler2D uColor;
  uniform sampler2D uDepth;
  uniform sampler2D uDye;
  uniform vec2 uParallax;
  uniform vec2 uUvScale;
  uniform vec2 uUvOffset;
  uniform vec2 uUvMin;
  uniform vec2 uUvMax;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv * uUvScale + uUvOffset;
    float d = texture2D(uDepth, uv).r;
    vec2 offset = (d - 0.5) * uParallax;
    vec2 colorUv = clamp(uv + offset, uUvMin, uUvMax);
    vec4 color = texture2D(uColor, colorUv);
    float g = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    vec3 gray = vec3(g, g, g);

    vec2 dyeUv = vec2(vUv.x, 1.0 - vUv.y);
    float dye = length(texture2D(uDye, dyeUv).rgb);
    float reveal = smoothstep(0.12, 0.52, dye * 1.75);
    reveal = pow(clamp(reveal, 0.0, 1.0), 1.18);

    color.rgb = mix(gray, color.rgb, reveal);
    gl_FragColor = color;
  }
`

function createProgram(gl, vsSrc, fsSrc) {
  const vs = gl.createShader(gl.VERTEX_SHADER)
  if (!vs) return null
  gl.shaderSource(vs, vsSrc)
  gl.compileShader(vs)
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(vs))
    return null
  }
  const fs = gl.createShader(gl.FRAGMENT_SHADER)
  if (!fs) return null
  gl.shaderSource(fs, fsSrc)
  gl.compileShader(fs)
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(fs))
    return null
  }
  const program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program))
    return null
  }
  return program
}

const HeroDepthCanvas = forwardRef(function HeroDepthCanvas({ photoUrl, depthUrl }, ref) {
  const canvasRef = useRef(null)
  const texRef = useRef({ color: null, depth: null })
  const imageSizeRef = useRef({ width: 1, height: 1 })
  const fluidSimRef = useRef(null)
  const prevFluidCursorRef = useRef({ x: 0.5, y: 0.5 })
  const lastFrameRef = useRef(0)
  const uniformsRef = useRef({
    parallaxX: 0,
    parallaxY: 0,
    scale: 1,
    cursorX: 0.5,
    cursorY: 0.5,
    cursorStrength: 1,
    shrinkProgress: 0,
    fluidEnabled: true,
  })

  useImperativeHandle(ref, () => ({
    setVisualState: (next) => {
      uniformsRef.current = {
        parallaxX: next.parallaxX ?? 0,
        parallaxY: next.parallaxY ?? 0,
        scale: next.scale ?? 1,
        cursorX: next.cursorX ?? 0.5,
        cursorY: next.cursorY ?? 0.5,
        cursorStrength: next.cursorStrength ?? 1,
        shrinkProgress: next.shrinkProgress ?? 0,
        fluidEnabled: next.fluidEnabled ?? true,
      }
    },
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !photoUrl || !depthUrl) return

    let cancelled = false
    let raf = 0
    let gl = null
    let program = null
    let loc = null
    let quadBuf = null

    const resize = () => {
      if (!gl || !canvas) return
      const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio : 1)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w > 0 && h > 0) {
        canvas.width = w * dpr
        canvas.height = h * dpr
      }
      gl.viewport(0, 0, canvas.width, canvas.height)
      fluidSimRef.current?.resize(canvas.width, canvas.height)
    }

    const draw = (now) => {
      if (!gl || !program || !loc || !quadBuf) return
      if (!texRef.current.color || canvas.width === 0) return

      if (!fluidSimRef.current) {
        fluidSimRef.current = new HeroFluidSim(gl, canvas.width, canvas.height)
      }

      const u = uniformsRef.current
      const fluidActive = u.fluidEnabled && u.shrinkProgress < 0.8

      if (fluidActive) {
        const dt = lastFrameRef.current
          ? Math.min(0.033, (now - lastFrameRef.current) / 1000)
          : 1 / 60
        lastFrameRef.current = now

        const fluidX = u.cursorX
        const fluidY = 1.0 - u.cursorY
        const prev = prevFluidCursorRef.current
        const deltaX = fluidX - prev.x
        const deltaY = fluidY - prev.y
        const move = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

        if (move > 0.00002) {
          const speed = Math.min(move * 220, 1)
          const dyeAmount = (0.042 + speed * 0.09) * u.cursorStrength
          fluidSimRef.current.splatCursorTrail(fluidX, fluidY, deltaX, deltaY, dyeAmount, {
            splatRadius: 0.068,
            dyeSplatRadius: 0.042,
            trailSteps: 5,
            trailLength: 5.5,
          })
        }
        prevFluidCursorRef.current = { x: fluidX, y: fluidY }

        fluidSimRef.current.step(dt)
      }

      const img = imageSizeRef.current
      const viewportAspect = canvas.width / canvas.height
      const imageAspect = img.width / img.height
      const isDesktopLandscape =
        typeof window !== 'undefined' && window.innerWidth > 768 && viewportAspect > 1
      let uvScaleX = 1
      let uvScaleY = 1
      let uvOffsetX = 0
      let uvOffsetY = 0
      if (imageAspect > viewportAspect) {
        uvScaleX = viewportAspect / imageAspect
        uvOffsetX = (1 - uvScaleX) * 0.5
      } else {
        uvScaleY = imageAspect / viewportAspect
        uvOffsetY = isDesktopLandscape ? (1 - uvScaleY) * 0.375 : (1 - uvScaleY) * 0.5
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(program)

      const parallaxScale = 0.005 * Math.max(0.5, u.scale)
      const rolloff = (v) => v * (1 - 0.5 * Math.min(1, Math.abs(v)))
      const px = rolloff(u.parallaxX) * parallaxScale
      const py = rolloff(u.parallaxY) * parallaxScale

      gl.uniform2f(loc.uParallax, px, py)
      gl.uniform2f(loc.uUvScale, uvScaleX, uvScaleY)
      gl.uniform2f(loc.uUvOffset, uvOffsetX, uvOffsetY)
      gl.uniform2f(loc.uUvMin, uvOffsetX, uvOffsetY)
      gl.uniform2f(loc.uUvMax, uvOffsetX + uvScaleX, uvOffsetY + uvScaleY)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texRef.current.color)
      gl.uniform1i(loc.uColor, 0)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, texRef.current.depth)
      gl.uniform1i(loc.uDepth, 1)
      gl.activeTexture(gl.TEXTURE2)
      gl.bindTexture(gl.TEXTURE_2D, fluidSimRef.current.getDyeTexture())
      gl.uniform1i(loc.uDye, 2)

      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
      const posLoc = gl.getAttribLocation(program, 'aPosition')
      const uvLoc = gl.getAttribLocation(program, 'aUv')
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0)
      gl.enableVertexAttribArray(uvLoc)
      gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 16, 8)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    const loop = (now) => {
      if (cancelled) return
      draw(now)
      raf = requestAnimationFrame(loop)
    }

    const loadTexture = (url, unit) =>
      new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          if (cancelled || !gl) return resolve(null)
          const tex = gl.createTexture()
          gl.activeTexture(gl.TEXTURE0 + unit)
          gl.bindTexture(gl.TEXTURE_2D, tex)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
          resolve({
            tex,
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
          })
        }
        img.onerror = () => resolve(null)
        img.src = url
      })

    const loadDepthTexture = (url, unit) =>
      new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          if (cancelled || !gl) return resolve(null)
          const tex = gl.createTexture()
          gl.activeTexture(gl.TEXTURE0 + unit)
          gl.bindTexture(gl.TEXTURE_2D, tex)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
          resolve(tex)
        }
        img.onerror = () => resolve(null)
        img.src = url
      })

    const boot = () => {
      if (cancelled) return

      gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false })
      if (!gl) return

      program = createProgram(gl, VERTEX, FRAGMENT)
      if (!program) return

      loc = {
        uParallax: gl.getUniformLocation(program, 'uParallax'),
        uUvScale: gl.getUniformLocation(program, 'uUvScale'),
        uUvOffset: gl.getUniformLocation(program, 'uUvOffset'),
        uUvMin: gl.getUniformLocation(program, 'uUvMin'),
        uUvMax: gl.getUniformLocation(program, 'uUvMax'),
        uColor: gl.getUniformLocation(program, 'uColor'),
        uDepth: gl.getUniformLocation(program, 'uDepth'),
        uDye: gl.getUniformLocation(program, 'uDye'),
      }

      quadBuf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          -1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0,
        ]),
        gl.STATIC_DRAW
      )

      resize()
      raf = requestAnimationFrame(loop)

      Promise.all([loadTexture(photoUrl, 0), loadDepthTexture(depthUrl, 1)]).then(
        ([colorResult, depthTex]) => {
          if (cancelled || !colorResult || !depthTex) return
          texRef.current = { color: colorResult.tex, depth: depthTex }
          imageSizeRef.current = {
            width: colorResult.width,
            height: colorResult.height,
          }
        }
      )
    }

    const ro = new ResizeObserver(() => resize())
    ro.observe(canvas)
    boot()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      fluidSimRef.current?.destroy()
      fluidSimRef.current = null
      if (gl) {
        if (texRef.current.color) gl.deleteTexture(texRef.current.color)
        if (texRef.current.depth) gl.deleteTexture(texRef.current.depth)
        if (quadBuf) gl.deleteBuffer(quadBuf)
        if (program) gl.deleteProgram(program)
      }
      texRef.current = { color: null, depth: null }
    }
  }, [photoUrl, depthUrl])

  return (
    <canvas
      ref={canvasRef}
      className="hero-depth-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  )
})

export default HeroDepthCanvas
