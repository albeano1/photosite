import { useEffect, useRef } from 'react'

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
  uniform vec2 uParallax;
  uniform float uSaturation;
  uniform vec2 uUvScale;
  uniform vec2 uUvOffset;
  uniform vec2 uUvMin;
  uniform vec2 uUvMax;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv * uUvScale + uUvOffset;
    float d = texture2D(uDepth, uv).r;
    vec2 offset = (d - 0.5) * uParallax;
    vec2 sampleUv = clamp(uv + offset, uUvMin, uUvMax);
    vec4 color = texture2D(uColor, sampleUv);
    float g = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    vec3 gray = vec3(g, g, g);
    color.rgb = mix(gray, color.rgb, uSaturation);
    gl_FragColor = color;
  }
`

function createProgram(gl, vsSrc, fsSrc) {
  const vs = gl.createShader(gl.VERTEX_SHADER)
  gl.shaderSource(vs, vsSrc)
  gl.compileShader(vs)
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(vs))
    return null
  }
  const fs = gl.createShader(gl.FRAGMENT_SHADER)
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

export default function HeroDepthCanvas({ photoUrl, depthUrl, parallaxX, parallaxY, saturation, scale }) {
  const canvasRef = useRef(null)
  const programRef = useRef(null)
  const quadBufRef = useRef(null)
  const texRef = useRef({ color: null, depth: null })
  const imageSizeRef = useRef({ width: 1, height: 1 })
  const uniformsRef = useRef({ parallaxX: 0, parallaxY: 0, saturation: 1, scale: 1 })
  uniformsRef.current = { parallaxX: parallaxX ?? 0, parallaxY: parallaxY ?? 0, saturation: saturation ?? 1, scale: scale ?? 1 }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !photoUrl || !depthUrl) return

    const gl = canvas.getContext('webgl', { alpha: false })
    if (!gl) return

    const program = createProgram(gl, VERTEX, FRAGMENT)
    if (!program) return
    programRef.current = program

    const quadBuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0
    ]), gl.STATIC_DRAW)
    quadBufRef.current = quadBuf

    const loadTexture = (url, unit) => {
      return new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const tex = gl.createTexture()
          gl.activeTexture(gl.TEXTURE0 + unit)
          gl.bindTexture(gl.TEXTURE_2D, tex)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
          resolve({ tex, width: img.naturalWidth || img.width, height: img.naturalHeight || img.height })
        }
        img.onerror = () => resolve(null)
        img.src = url
      })
    }

    const loadDepthTexture = (url, unit) => {
      return new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
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
    }

    let cancelled = false
    Promise.all([
      loadTexture(photoUrl, 0, true),
      loadDepthTexture(depthUrl, 1)
    ]).then(([colorResult, depthTex]) => {
      if (cancelled || !colorResult || !depthTex) return
      texRef.current = { color: colorResult.tex, depth: depthTex }
      imageSizeRef.current = { width: colorResult.width, height: colorResult.height }
    })

    return () => {
      cancelled = true
      if (texRef.current.color) gl.deleteTexture(texRef.current.color)
      if (texRef.current.depth) gl.deleteTexture(texRef.current.depth)
      texRef.current = { color: null, depth: null }
      if (quadBufRef.current) gl.deleteBuffer(quadBufRef.current)
      quadBufRef.current = null
      gl.deleteProgram(program)
    }
  }, [photoUrl, depthUrl])

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas?.getContext('webgl')
    const program = programRef.current
    if (!gl || !program) return

    const resize = () => {
      const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio : 1)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
        gl.viewport(0, 0, canvas.width, canvas.height)
      }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const draw = () => {
      if (!texRef.current.color || !quadBufRef.current || canvas.width === 0 || canvas.height === 0) return
      const u = uniformsRef.current
      const img = imageSizeRef.current
      const viewportAspect = canvas.width / canvas.height
      const imageAspect = img.width / img.height
      const isDesktopLandscape = typeof window !== 'undefined' && window.innerWidth > 768 && viewportAspect > 1
      let uvScaleX = 1, uvScaleY = 1, uvOffsetX = 0, uvOffsetY = 0
      if (imageAspect > viewportAspect) {
        uvScaleX = viewportAspect / imageAspect
        uvOffsetX = (1 - uvScaleX) * 0.5
      } else {
        uvScaleY = imageAspect / viewportAspect
        uvOffsetY = isDesktopLandscape ? (1 - uvScaleY) * 0.375 : (1 - uvScaleY) * 0.5
      }
      const punch = 1
      const padX = (1 - punch) * 0.5
      const padY = (1 - punch) * 0.5
      uvOffsetX += uvScaleX * padX
      uvOffsetY += uvScaleY * padY
      uvScaleX *= punch
      uvScaleY *= punch
      gl.useProgram(program)
      const parallaxScale = 0.005 * Math.max(0.5, u.scale)
      const rolloff = (v) => v * (1 - 0.5 * Math.min(1, Math.abs(v)))
      const px = rolloff(u.parallaxX) * parallaxScale
      const py = rolloff(u.parallaxY) * parallaxScale
      gl.uniform2f(gl.getUniformLocation(program, 'uParallax'), px, py)
      gl.uniform1f(gl.getUniformLocation(program, 'uSaturation'), u.saturation)
      gl.uniform2f(gl.getUniformLocation(program, 'uUvScale'), uvScaleX, uvScaleY)
      gl.uniform2f(gl.getUniformLocation(program, 'uUvOffset'), uvOffsetX, uvOffsetY)
      gl.uniform2f(gl.getUniformLocation(program, 'uUvMin'), uvOffsetX, uvOffsetY)
      gl.uniform2f(gl.getUniformLocation(program, 'uUvMax'), uvOffsetX + uvScaleX, uvOffsetY + uvScaleY)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texRef.current.color)
      gl.uniform1i(gl.getUniformLocation(program, 'uColor'), 0)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, texRef.current.depth)
      gl.uniform1i(gl.getUniformLocation(program, 'uDepth'), 1)
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBufRef.current)
      const posLoc = gl.getAttribLocation(program, 'aPosition')
      const uvLoc = gl.getAttribLocation(program, 'aUv')
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0)
      gl.enableVertexAttribArray(uvLoc)
      gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 16, 8)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    let raf
    const loop = () => {
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

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
}
