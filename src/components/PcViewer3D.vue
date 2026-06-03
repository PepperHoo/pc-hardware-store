<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  selectedParts: {
    type: Object,
    default: () => ({})
  },
  selectedProducts: {
    type: Object,
    default: () => ({})
  }
})

const canvasRef = ref(null)
let THREE = null
let renderer, scene, camera, animId
let pcGroup = null
let componentMeshes = {}
let componentLights = {}

// Mouse orbit state
let isDragging = false
let prevMouse = { x: 0, y: 0 }
let rotY = 0.3
let rotX = -0.15

// Category → component slot key mapping
const categoryToSlot = {
  motherboard: 'motherboard',
  processor:   'processor',
  ram:         'ram',
  gpu:         'gpu',
  storage:     'storage',
  psu:         'psu',
  cooler:      'cooler',
  casing:      'casing',
  rgb:         'rgb'
}

const categoryLabels = {
  motherboard: 'Motherboard',
  processor: 'Processor',
  ram: 'RAM',
  gpu: 'Graphics Card',
  storage: 'Storage',
  psu: 'Power Supply',
  cooler: 'CPU Cooler',
  casing: 'PC Case',
  rgb: 'RGB / Fans'
}

function categoryLabel(category) {
  return categoryLabels[category] || category
}

function productImage(product) {
  return product?.image || product?.image_url || product?.imageUrl || product?.thumbnail || ''
}

const selectedProductList = computed(() =>
  Object.entries(props.selectedProducts || {})
    .map(([category, product]) => ({
      category,
      product,
      image: productImage(product)
    }))
    .filter(item => item.product && item.image)
)

const hasRealPreview = computed(() => selectedProductList.value.length > 0)

// RGB colors per category for glow
const glowColors = {
  motherboard: 0x22c55e,
  processor:   0x3b82f6,
  ram:         0x8b5cf6,
  gpu:         0xf59e0b,
  storage:     0x06b6d4,
  psu:         0xef4444,
  cooler:      0x60a5fa,
  casing:      0x94a3b8,
  rgb:         0xff00ff
}

async function loadThree() {
  return new Promise((resolve, reject) => {
    if (window.THREE) { resolve(window.THREE); return }
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
    s.onload = () => resolve(window.THREE)
    s.onerror = reject
    document.head.appendChild(s)
  })
}

function buildScene() {
  const T = THREE

  scene = new T.Scene()
  scene.background = new T.Color(0x0a0f1e)
  scene.fog = new T.Fog(0x0a0f1e, 18, 32)

  // Camera
  camera = new T.PerspectiveCamera(45, canvasRef.value.clientWidth / canvasRef.value.clientHeight, 0.1, 100)
  camera.position.set(0, 0, 14)

  // Renderer
  renderer = new T.WebGLRenderer({ canvas: canvasRef.value, antialias: true, alpha: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(canvasRef.value.clientWidth, canvasRef.value.clientHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = T.PCFSoftShadowMap

  // Ambient light
  scene.add(new T.AmbientLight(0x1e293b, 1.2))

  // Key directional light
  const dir = new T.DirectionalLight(0xffffff, 0.8)
  dir.position.set(5, 10, 8)
  scene.add(dir)

  pcGroup = new T.Group()
  scene.add(pcGroup)

  buildPcCase()
  buildComponents()
}

function mat(color, opacity = 1, emissive = 0x000000, emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity,
    transparent: opacity < 1,
    opacity,
    roughness: 0.4,
    metalness: 0.6
  })
}

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function buildPcCase() {
  const T = THREE
  const dark = mat(0x1a1a2e)
  const darkMid = mat(0x16213e)
  const metal = mat(0x0f3460, 1, 0x000000, 0)

  // Back panel
  pcGroup.add(box(5, 8.5, 0.12, darkMid, 0, 0, -1.44))
  // Top panel
  pcGroup.add(box(5, 0.12, 3, darkMid, 0, 4.25, 0))
  // Bottom panel
  pcGroup.add(box(5, 0.12, 3, dark, 0, -4.25, 0))
  // Left side (solid)
  pcGroup.add(box(0.12, 8.5, 3, dark, -2.5, 0, 0))
  // Right side (solid)
  pcGroup.add(box(0.12, 8.5, 3, dark, 2.5, 0, 0))
  // Front panel (partial – two strips top and bottom)
  pcGroup.add(box(5, 1.5, 0.12, metal, 0, 3.5, 1.44))
  pcGroup.add(box(5, 2.0, 0.12, metal, 0, -3.25, 1.44))
  // Front strip (middle gap is "mesh")
  const meshMat = mat(0x0a0a14, 0.85)
  pcGroup.add(box(5, 5, 0.08, meshMat, 0, 0.25, 1.44))

  // Glass side panel (right face, facing camera)
  const glassMat = new T.MeshStandardMaterial({
    color: 0x4a90d9,
    transparent: true,
    opacity: 0.13,
    roughness: 0.05,
    metalness: 0.1,
    side: T.DoubleSide
  })
  const glass = new T.Mesh(new T.PlaneGeometry(5, 8.5), glassMat)
  glass.position.set(0, 0, 1.5)
  pcGroup.add(glass)

  // Glass frame
  const frameMat = mat(0x334155, 0.9)
  pcGroup.add(box(5.05, 0.08, 0.08, frameMat, 0, 4.3, 1.5))
  pcGroup.add(box(5.05, 0.08, 0.08, frameMat, 0, -4.3, 1.5))
  pcGroup.add(box(0.08, 8.7, 0.08, frameMat, -2.55, 0, 1.5))
  pcGroup.add(box(0.08, 8.7, 0.08, frameMat, 2.55, 0, 1.5))

  // IO shield on back
  const io = mat(0x0e1a30)
  pcGroup.add(box(1.4, 1.0, 0.05, io, -0.8, 2.8, -1.45))

  // Top exhaust grill
  const grillMat = mat(0x1e2d44)
  for (let i = -1.8; i <= 1.8; i += 0.4) {
    const slot = new T.Mesh(new T.BoxGeometry(0.18, 0.04, 2.6), grillMat)
    slot.position.set(i, 4.3, 0)
    pcGroup.add(slot)
  }

  // Power button
  const btnMat = mat(0x3b82f6, 1, 0x3b82f6, 0.4)
  const btn = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.06, 16), btnMat)
  btn.rotation.x = Math.PI / 2
  btn.position.set(1.8, 3.2, 1.48)
  pcGroup.add(btn)
}

function buildComponents() {
  const T = THREE

  // ─── Motherboard ───────────────────────────────
  {
    const mbMat = new T.MeshStandardMaterial({ color: 0x1a3a1a, roughness: 0.7, metalness: 0.3 })
    const mb = box(4.0, 5.0, 0.1, mbMat, 0, 0.5, -1.2)
    mb.visible = false
    componentMeshes.motherboard = [mb]
    pcGroup.add(mb)

    // PCIe slots
    for (let i = 0; i < 3; i++) {
      const slotMat = mat(0x2a5a2a)
      const slot = box(2.2, 0.1, 0.08, slotMat, -0.4, 0.8 - i * 0.4, -1.14)
      slot.visible = false
      componentMeshes.motherboard.push(slot)
      pcGroup.add(slot)
    }

    // Capacitors
    for (let i = 0; i < 5; i++) {
      const cap = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.18, 8), mat(0x4a7c4a))
      cap.position.set(-1.6 + i * 0.35, 2.6, -1.14)
      cap.visible = false
      componentMeshes.motherboard.push(cap)
      pcGroup.add(cap)
    }

    const light = new T.PointLight(glowColors.motherboard, 0, 3)
    light.position.set(0, 0.5, -0.8)
    componentLights.motherboard = light
    pcGroup.add(light)
  }

  // ─── Processor (CPU) ──────────────────────────
  {
    const cpuMat = mat(0x888888, 1, 0x000000, 0)
    const cpu = box(0.65, 0.65, 0.12, cpuMat, 0.3, 1.6, -1.08)
    cpu.visible = false
    componentMeshes.processor = [cpu]
    pcGroup.add(cpu)

    // IHS (integrated heat spreader)
    const ihs = mat(0xb0b0b0)
    const ihsMesh = box(0.52, 0.52, 0.04, ihs, 0.3, 1.6, -1.01)
    ihsMesh.visible = false
    componentMeshes.processor.push(ihsMesh)
    pcGroup.add(ihsMesh)

    const light = new T.PointLight(glowColors.processor, 0, 2)
    light.position.set(0.3, 1.6, -0.7)
    componentLights.processor = light
    pcGroup.add(light)
  }

  // ─── CPU Cooler ────────────────────────────────
  {
    const baseMat = mat(0x888888)
    const base = box(0.7, 0.1, 0.7, baseMat, 0.3, 1.85, -1.0)
    base.visible = false
    componentMeshes.cooler = [base]
    pcGroup.add(base)

    // Tower fins
    for (let i = 0; i < 6; i++) {
      const fin = new T.Mesh(
        new THREE.BoxGeometry(0.65, 0.04, 0.65),
        mat(0xaaaaaa, 1, 0x60a5fa, 0)
      )
      fin.position.set(0.3, 2.0 + i * 0.18, -1.0)
      fin.visible = false
      componentMeshes.cooler.push(fin)
      pcGroup.add(fin)
    }

    // Fan on cooler
    const fanMat = mat(0x222222)
    const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 20), fanMat)
    fan.rotation.x = Math.PI / 2
    fan.position.set(0.3, 2.5, -0.72)
    fan.visible = false
    componentMeshes.cooler.push(fan)
    pcGroup.add(fan)

    const light = new T.PointLight(glowColors.cooler, 0, 3)
    light.position.set(0.3, 2.3, -0.6)
    componentLights.cooler = light
    pcGroup.add(light)
  }

  // ─── RAM ──────────────────────────────────────
  {
    componentMeshes.ram = []
    const ramPositions = [[-0.55, 2.0], [-0.25, 2.0]]
    ramPositions.forEach(([x, y]) => {
      const pcbMat = mat(0x1a1a3a)
      const pcb = box(0.12, 1.4, 0.06, pcbMat, x, y, -1.12)
      pcb.visible = false
      componentMeshes.ram.push(pcb)
      pcGroup.add(pcb)

      // RGB strip on RAM
      const rgbMat = new T.MeshStandardMaterial({
        color: 0x000000,
        emissive: 0x8b5cf6,
        emissiveIntensity: 0,
        transparent: false
      })
      const strip = box(0.12, 0.18, 0.07, rgbMat, x, y + 0.64, -1.12)
      strip.visible = false
      strip.userData.rgbStrip = true
      componentMeshes.ram.push(strip)
      pcGroup.add(strip)
    })

    const light = new T.PointLight(glowColors.ram, 0, 2.5)
    light.position.set(-0.4, 2.0, -0.8)
    componentLights.ram = light
    pcGroup.add(light)
  }

  // ─── GPU ──────────────────────────────────────
  {
    const gpuPcbMat = mat(0x111111, 1, 0x000000, 0)
    const gpu = box(3.2, 0.55, 0.65, gpuPcbMat, -0.1, -0.6, -1.0)
    gpu.visible = false
    componentMeshes.gpu = [gpu]
    pcGroup.add(gpu)

    // GPU fans
    for (let i = -0.9; i <= 0.9; i += 0.9) {
      const shroud = box(0.7, 0.48, 0.12, mat(0x222222), i, -0.6, -0.68)
      shroud.visible = false
      componentMeshes.gpu.push(shroud)
      pcGroup.add(shroud)

      const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.06, 20), mat(0x333333))
      fan.rotation.x = Math.PI / 2
      fan.position.set(i, -0.6, -0.62)
      fan.visible = false
      componentMeshes.gpu.push(fan)
      pcGroup.add(fan)
    }

    // RGB line on GPU
    const rgbLine = box(3.2, 0.06, 0.08, new THREE.MeshStandardMaterial({
      color: 0x000000, emissive: 0xf59e0b, emissiveIntensity: 0
    }), -0.1, -0.88, -0.7)
    rgbLine.visible = false
    rgbLine.userData.rgbStrip = true
    componentMeshes.gpu.push(rgbLine)
    pcGroup.add(rgbLine)

    const light = new T.PointLight(glowColors.gpu, 0, 4)
    light.position.set(-0.1, -0.6, -0.5)
    componentLights.gpu = light
    pcGroup.add(light)
  }

  // ─── PSU ──────────────────────────────────────
  {
    const psuMat = mat(0x111111)
    const psu = box(2.5, 1.2, 1.8, psuMat, 0, -3.3, -0.4)
    psu.visible = false
    componentMeshes.psu = [psu]
    pcGroup.add(psu)

    const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 24), mat(0x222222))
    fan.rotation.x = Math.PI / 2
    fan.position.set(0, -3.3, 0.52)
    fan.visible = false
    componentMeshes.psu.push(fan)
    pcGroup.add(fan)

    const light = new T.PointLight(glowColors.psu, 0, 2.5)
    light.position.set(0, -3.3, 0)
    componentLights.psu = light
    pcGroup.add(light)
  }

  // ─── Storage ──────────────────────────────────
  {
    const storageMat = mat(0x1a1a2e)
    const storage = box(1.8, 0.14, 1.0, storageMat, -0.8, -2.0, -1.0)
    storage.visible = false
    componentMeshes.storage = [storage]
    pcGroup.add(storage)

    const light = new T.PointLight(glowColors.storage, 0, 2)
    light.position.set(-0.8, -2.0, -0.7)
    componentLights.storage = light
    pcGroup.add(light)
  }

  // ─── Case (casing) ────────────────────────────
  // The case is always visible since it's the shell itself.
  // We add a subtle internal accent light
  {
    const light = new T.PointLight(glowColors.casing, 0, 5)
    light.position.set(0, 0, 0)
    componentLights.casing = light
    pcGroup.add(light)
    componentMeshes.casing = []
  }

  // ─── RGB / Fans ───────────────────────────────
  {
    componentMeshes.rgb = []
    // 3 intake fans at front (left side internally)
    const fanPositions = [
      [-1.0, 2.0], [-1.0, 0.5], [-1.0, -1.0]
    ]
    fanPositions.forEach(([y, dummy]) => {
      const frame = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 8, 24), mat(0x1e293b))
      frame.position.set(-1.8, dummy === 2.0 ? 1.8 : dummy === 0.5 ? 0.3 : -1.2, 0.0)
      frame.rotation.y = Math.PI / 2
      frame.visible = false
      componentMeshes.rgb.push(frame)
      pcGroup.add(frame)

      const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 20), new THREE.MeshStandardMaterial({
        color: 0x111827,
        transparent: true,
        opacity: 0.6
      }))
      blade.rotation.z = Math.PI / 2
      blade.position.copy(frame.position)
      blade.visible = false
      componentMeshes.rgb.push(blade)
      pcGroup.add(blade)
    })

    // RGB strip on case interior (LED bar at top)
    const strip = box(4.5, 0.08, 0.1, new THREE.MeshStandardMaterial({
      color: 0x000000, emissive: 0xff00ff, emissiveIntensity: 0
    }), 0, 3.9, -0.2)
    strip.userData.rgbStrip = true
    strip.visible = false
    componentMeshes.rgb.push(strip)
    pcGroup.add(strip)

    const light = new THREE.PointLight(glowColors.rgb, 0, 6)
    light.position.set(0, 3.5, 0)
    componentLights.rgb = light
    pcGroup.add(light)
  }
}

function updateVisibility() {
  const selected = props.selectedParts

  Object.keys(categoryToSlot).forEach(category => {
    const isSelected = !!selected[category]
    const meshes = componentMeshes[category] || []
    const light = componentLights[category]

    meshes.forEach(m => {
      m.visible = isSelected
      // Animate RGB strips
      if (m.userData.rgbStrip && m.material.emissiveIntensity !== undefined) {
        m.material.emissiveIntensity = isSelected ? 1.2 : 0
      }
    })

    if (light) {
      light.intensity = isSelected ? 1.8 : 0
    }
  })
}

let clock
function animate() {
  animId = requestAnimationFrame(animate)
  const t = clock.getElapsedTime()

  // Gently pulse RGB strips
  const pulse = 0.7 + 0.3 * Math.sin(t * 2)
  Object.keys(componentMeshes).forEach(cat => {
    if (props.selectedParts[cat]) {
      componentMeshes[cat].forEach(m => {
        if (m.userData.rgbStrip) {
          m.material.emissiveIntensity = pulse * 1.5
        }
      })
    }
  })

  // Apply mouse orbit rotation
  pcGroup.rotation.y = rotY
  pcGroup.rotation.x = rotX

  renderer.render(scene, camera)
}

function onMouseDown(e) {
  isDragging = true
  prevMouse = { x: e.clientX, y: e.clientY }
}

function onMouseMove(e) {
  if (!isDragging) return
  const dx = e.clientX - prevMouse.x
  const dy = e.clientY - prevMouse.y
  rotY += dx * 0.008
  rotX += dy * 0.008
  rotX = Math.max(-0.6, Math.min(0.6, rotX))
  prevMouse = { x: e.clientX, y: e.clientY }
}

function onMouseUp() {
  isDragging = false
}

function onTouchStart(e) {
  if (e.touches.length === 1) {
    isDragging = true
    prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
}

function onTouchMove(e) {
  if (!isDragging || e.touches.length !== 1) return
  const dx = e.touches[0].clientX - prevMouse.x
  const dy = e.touches[0].clientY - prevMouse.y
  rotY += dx * 0.008
  rotX += dy * 0.008
  rotX = Math.max(-0.6, Math.min(0.6, rotX))
  prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY }
}

function onResize() {
  if (!renderer || !canvasRef.value) return
  const w = canvasRef.value.clientWidth
  const h = canvasRef.value.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

onMounted(async () => {
  THREE = await loadThree()
  clock = new THREE.Clock()
  buildScene()
  updateVisibility()
  animate()

  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('touchend', onMouseUp)
  window.addEventListener('touchmove', onTouchMove, { passive: true })
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animId)
  renderer?.dispose()
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('touchend', onMouseUp)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('resize', onResize)
})

watch(() => props.selectedParts, updateVisibility, { deep: true })
</script>

<template>
  <div class="viewer-wrap">
    <div class="viewer-label">
      <span class="viewer-badge">Actual Product Preview</span>
      <span class="viewer-hint">Drag case to rotate</span>
    </div>

    <canvas
      ref="canvasRef"
      class="viewer-canvas"
      @mousedown="onMouseDown"
      @touchstart.passive="onTouchStart"
    />

    <div v-if="hasRealPreview" class="real-parts-overlay">
      <article
        v-for="item in selectedProductList"
        :key="`${item.category}-${item.product.id || item.product.name}`"
        class="real-part-card"
      >
        <div class="real-img-wrap">
          <img :src="item.image" :alt="item.product.name" />
        </div>
        <div class="real-part-info">
          <span>{{ categoryLabel(item.category) }}</span>
          <p>{{ item.product.name }}</p>
        </div>
      </article>
    </div>

    <div v-else class="real-empty-overlay">
      Select a component to show its real product image.
    </div>

    <div class="viewer-legend">
      <div
        v-for="(color, cat) in {
          motherboard: '#22c55e',
          processor: '#3b82f6',
          ram: '#8b5cf6',
          gpu: '#f59e0b',
          storage: '#06b6d4',
          psu: '#ef4444',
          cooler: '#60a5fa',
          rgb: '#ff00ff'
        }"
        :key="cat"
        class="legend-item"
        :class="{ active: selectedParts[cat] }"
      >
        <span class="legend-dot" :style="{ background: color }" />
        <span>{{ categoryLabel(cat) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.viewer-wrap {
  position: sticky;
  top: 92px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: 18px;
  overflow: hidden;
  background: linear-gradient(145deg, #0a0f1e, #0d1526);
  border: 1px solid rgba(59,130,246,0.25);
  box-shadow: 0 24px 52px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
  isolation: isolate;
}

.viewer-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px 0;
}

.viewer-badge {
  padding: 5px 12px;
  border-radius: 20px;
  background: rgba(59,130,246,0.18);
  color: #93c5fd;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.viewer-hint {
  color: #475569;
  font-size: 12px;
}

.viewer-canvas {
  width: 100%;
  height: 480px;
  display: block;
  cursor: grab;
}

.viewer-canvas:active {
  cursor: grabbing;
}

.real-parts-overlay {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 76px;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  max-height: 172px;
  overflow: auto;
  padding-right: 4px;
}

.real-parts-overlay::-webkit-scrollbar {
  width: 5px;
}

.real-parts-overlay::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(96, 165, 250, 0.35);
}

.real-part-card {
  display: grid;
  grid-template-columns: 52px 1fr;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid rgba(96, 165, 250, 0.24);
  background: rgba(2, 6, 23, 0.82);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  transform: perspective(780px) rotateY(-5deg);
}

.real-part-card:first-child {
  grid-column: span 2;
  grid-template-columns: 76px 1fr;
}

.real-img-wrap {
  width: 100%;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 5px;
  border-radius: 9px;
  background: radial-gradient(circle at 50% 38%, rgba(96, 165, 250, 0.22), rgba(15, 23, 42, 0.92) 70%);
}

.real-part-card:first-child .real-img-wrap {
  height: 64px;
}

.real-img-wrap img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 14px rgba(0, 0, 0, 0.35));
}

.real-part-info {
  min-width: 0;
}

.real-part-info span {
  display: block;
  color: #60a5fa;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.08em;
  line-height: 1.2;
  text-transform: uppercase;
}

.real-part-info p {
  display: -webkit-box;
  margin: 3px 0 0;
  overflow: hidden;
  color: #f8fafc;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.25;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.real-empty-overlay {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 92px;
  z-index: 2;
  padding: 12px;
  border-radius: 14px;
  border: 1px dashed rgba(96, 165, 250, 0.24);
  background: rgba(2, 6, 23, 0.56);
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  backdrop-filter: blur(10px);
}

.viewer-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 16px 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid rgba(148,163,184,0.1);
  background: rgba(30,41,59,0.4);
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  text-transform: capitalize;
  transition: 0.2s;
}

.legend-item.active {
  color: #cbd5e1;
  border-color: rgba(148,163,184,0.25);
  background: rgba(30,41,59,0.8);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  opacity: 0.4;
  transition: 0.2s;
}

.legend-item.active .legend-dot {
  opacity: 1;
  box-shadow: 0 0 6px currentColor;
}

@media (max-width: 600px) {
  .real-parts-overlay {
    grid-template-columns: 1fr;
    bottom: 82px;
    max-height: 150px;
  }

  .real-part-card:first-child {
    grid-column: auto;
    grid-template-columns: 52px 1fr;
  }

  .real-part-card:first-child .real-img-wrap {
    height: 46px;
  }
}
</style>
