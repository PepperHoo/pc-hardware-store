<script setup>
import { computed, onMounted, ref } from 'vue'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const isReady = ref(false)
const canUseModelViewer = ref(false)
const imageZoom = ref(1)
const imageRotateX = ref(0)
const imageRotateY = ref(0)
const isInspecting = ref(false)
const imagePointer = ref({ x: 0, y: 0 })

const MODEL_VIEWER_SRC = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'

function loadModelViewerApi() {
  if (customElements.get('model-viewer')) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${MODEL_VIEWER_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.type = 'module'
    script.src = MODEL_VIEWER_SRC
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function extractSketchfabId(url = '') {
  const text = String(url)
  const modelMatch = text.match(/models\/([a-z0-9]+)/i)
  if (modelMatch?.[1]) return modelMatch[1]

  const slugMatch = text.match(/3d-models\/[^/]*-([a-f0-9]{32})/i)
  if (slugMatch?.[1]) return slugMatch[1]

  return ''
}

const rawModelUrl = computed(() =>
  props.product?.modelUrl ||
  props.product?.model_url ||
  props.product?.threeDModelUrl ||
  ''
)

const imagePreviewUrl = computed(() =>
  props.product?.image ||
  props.product?.image_url ||
  props.product?.imageUrl ||
  props.product?.thumbnail ||
  ''
)

const modelFileUrl = computed(() => {
  const url = String(rawModelUrl.value || '').trim()
  return /\.(glb|gltf|usdz)(\?|#|$)/i.test(url) ? url : ''
})

const sketchfabModelId = computed(() =>
  extractSketchfabId(rawModelUrl.value)
)

const sketchfabEmbedUrl = computed(() => {
  if (!sketchfabModelId.value) return ''

  const params = new URLSearchParams({
    autostart: '1',
    preload: '1',
    ui_theme: 'dark',
    ui_infos: '0',
    ui_stop: '0',
    ui_watermark: '1',
    dnt: '1'
  })
  return `https://sketchfab.com/models/${sketchfabModelId.value}/embed?${params.toString()}`
})

const viewerMode = computed(() => {
  if (modelFileUrl.value && canUseModelViewer.value) return 'google-model-viewer'
  if (sketchfabModelId.value) return 'sketchfab'
  return 'product-image'
})

const imageTransformStyle = computed(() => ({
  transform: `perspective(900px) rotateX(${imageRotateX.value}deg) rotateY(${imageRotateY.value}deg) scale(${imageZoom.value})`
}))

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function onImagePointerDown(event) {
  if (!imagePreviewUrl.value) return
  isInspecting.value = true
  imagePointer.value = { x: event.clientX, y: event.clientY }
  event.currentTarget?.setPointerCapture?.(event.pointerId)
}

function onImagePointerMove(event) {
  if (!isInspecting.value) return

  const dx = event.clientX - imagePointer.value.x
  const dy = event.clientY - imagePointer.value.y
  imageRotateY.value = clamp(imageRotateY.value + dx * 0.16, -28, 28)
  imageRotateX.value = clamp(imageRotateX.value - dy * 0.16, -18, 18)
  imagePointer.value = { x: event.clientX, y: event.clientY }
}

function onImagePointerUp(event) {
  isInspecting.value = false
  event.currentTarget?.releasePointerCapture?.(event.pointerId)
}

function onImageWheel(event) {
  imageZoom.value = clamp(Number((imageZoom.value + (event.deltaY < 0 ? 0.08 : -0.08)).toFixed(2)), 0.85, 1.8)
}

function zoomImage(delta) {
  imageZoom.value = clamp(Number((imageZoom.value + delta).toFixed(2)), 0.85, 1.8)
}

function resetImageView() {
  imageZoom.value = 1
  imageRotateX.value = 0
  imageRotateY.value = 0
}

onMounted(async () => {
  if (!modelFileUrl.value) {
    isReady.value = true
    return
  }

  try {
    await loadModelViewerApi()
    canUseModelViewer.value = true
  } catch (error) {
    canUseModelViewer.value = false
  } finally {
    isReady.value = true
  }
})
</script>

<template>
  <section class="product-3d glass">
    <div class="viewer-head">
      <div>
        <span class="viewer-kicker">3D Model</span>
        <h2 class="viewer-title">Interactive Preview</h2>
      </div>
      <span class="viewer-source">
        {{ viewerMode === 'google-model-viewer' ? 'Google Model Viewer' : viewerMode === 'sketchfab' ? 'Sketchfab' : 'Product Image' }}
      </span>
    </div>

    <div class="viewer-shell">
      <model-viewer
        v-if="viewerMode === 'google-model-viewer'"
        class="google-viewer"
        :src="modelFileUrl"
        :poster="imagePreviewUrl"
        camera-controls
        auto-rotate
        shadow-intensity="1"
        exposure="0.9"
        loading="lazy"
        reveal="auto"
        ar
      />

      <iframe
        v-else-if="viewerMode === 'sketchfab'"
        class="sketchfab-viewer"
        :src="sketchfabEmbedUrl"
        title="3D product preview"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowfullscreen
        frameborder="0"
      />

      <div
        v-else
        class="image-preview-model"
        :class="{ inspecting: isInspecting }"
        @pointerdown="onImagePointerDown"
        @pointermove="onImagePointerMove"
        @pointerup="onImagePointerUp"
        @pointercancel="onImagePointerUp"
        @wheel.prevent="onImageWheel"
      >
        <div v-if="imagePreviewUrl" class="image-stage">
          <img
            :src="imagePreviewUrl"
            :alt="product.name"
            class="interactive-product-img"
            :style="imageTransformStyle"
            draggable="false"
          />
        </div>
        <div v-else class="image-preview-missing">No product image available</div>

        <div v-if="imagePreviewUrl" class="image-tools" @pointerdown.stop>
          <button type="button" class="image-tool-btn" @click="zoomImage(-0.12)" aria-label="Zoom out">-</button>
          <button type="button" class="image-tool-btn" @click="resetImageView" aria-label="Reset preview">Reset</button>
          <button type="button" class="image-tool-btn" @click="zoomImage(0.12)" aria-label="Zoom in">+</button>
        </div>

        <div class="image-preview-note">
          <span>Actual Product Image</span>
          <p>Drag to tilt and scroll to zoom. Add a GLB, GLTF, USDZ, or Sketchfab URL for a true rotating 3D model.</p>
        </div>
      </div>

      <div v-if="!isReady" class="viewer-loading">
        <div class="viewer-spinner" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.product-3d {
  margin-top: 40px;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(96, 165, 250, 0.18);
}

.viewer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.viewer-kicker,
.viewer-source {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid rgba(96, 165, 250, 0.25);
  background: rgba(59, 130, 246, 0.1);
  color: #93c5fd;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.viewer-source {
  color: #6ee7b7;
  border-color: rgba(45, 212, 191, 0.25);
  background: rgba(45, 212, 191, 0.1);
}

.viewer-title {
  margin: 8px 0 0;
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(18px, 2vw, 26px);
  font-weight: 900;
  color: #f8fafc;
}

.viewer-shell {
  position: relative;
  overflow: hidden;
  min-height: 420px;
  border-radius: 18px;
  background:
    radial-gradient(circle at 50% 30%, rgba(59, 130, 246, 0.16), transparent 58%),
    linear-gradient(145deg, #07101e, #020617);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.google-viewer,
.sketchfab-viewer {
  display: block;
  width: 100%;
  height: 520px;
  border: 0;
}

.image-preview-model {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 520px;
  padding: 34px 24px 96px;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.image-preview-model.inspecting {
  cursor: grabbing;
}

.image-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 380px;
  transform-style: preserve-3d;
}

.interactive-product-img {
  max-width: min(78%, 680px);
  max-height: 380px;
  object-fit: contain;
  filter: drop-shadow(0 28px 36px rgba(0, 0, 0, 0.4));
  transition: transform 0.18s ease, filter 0.18s ease;
  will-change: transform;
}

.image-preview-model.inspecting .interactive-product-img {
  transition: none;
  filter: drop-shadow(0 34px 42px rgba(0, 0, 0, 0.48));
}

.image-tools {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  display: flex;
  gap: 8px;
  padding: 6px;
  border-radius: 14px;
  border: 1px solid rgba(96, 165, 250, 0.18);
  background: rgba(2, 6, 23, 0.78);
  backdrop-filter: blur(14px);
}

.image-tool-btn {
  min-width: 36px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.12);
  color: #bfdbfe;
  cursor: pointer;
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  font-weight: 800;
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
}

.image-tool-btn:hover {
  border-color: rgba(96, 165, 250, 0.46);
  background: rgba(59, 130, 246, 0.24);
  transform: translateY(-1px);
}

.image-preview-missing {
  color: #64748b;
  font-size: 14px;
  font-weight: 800;
}

.image-preview-note {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 20px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(96, 165, 250, 0.18);
  background: rgba(2, 6, 23, 0.76);
  backdrop-filter: blur(14px);
}

.image-preview-note span {
  display: block;
  color: #93c5fd;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.image-preview-note p {
  margin: 6px 0 0;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.5;
}

.viewer-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 6, 23, 0.72);
  pointer-events: none;
}

.viewer-spinner {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 3px solid rgba(59, 130, 246, 0.22);
  border-top-color: #3b82f6;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

:global(:root[data-theme="light"]) .product-3d {
  border-color: rgba(37, 99, 235, 0.16);
}

:global(:root[data-theme="light"]) .viewer-title {
  color: #172033;
}

:global(:root[data-theme="light"]) .viewer-shell {
  background:
    radial-gradient(circle at 50% 24%, rgba(59, 130, 246, 0.18), transparent 58%),
    linear-gradient(145deg, #ffffff, #edf5fb);
  border-color: rgba(15, 23, 42, 0.1);
}

:global(:root[data-theme="light"]) .image-preview-note {
  background: rgba(255, 255, 255, 0.84);
  border-color: rgba(37, 99, 235, 0.16);
}

:global(:root[data-theme="light"]) .image-preview-note p {
  color: #64748b;
}

:global(:root[data-theme="light"]) .image-tools {
  background: rgba(255, 255, 255, 0.86);
  border-color: rgba(37, 99, 235, 0.16);
}

:global(:root[data-theme="light"]) .image-tool-btn {
  background: rgba(37, 99, 235, 0.1);
  border-color: rgba(37, 99, 235, 0.18);
  color: #2563eb;
}

@media (max-width: 700px) {
  .product-3d {
    margin-top: 28px;
    padding: 14px;
    border-radius: 18px;
  }

  .viewer-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .viewer-shell {
    min-height: 320px;
    border-radius: 14px;
  }

  .google-viewer,
  .sketchfab-viewer {
    height: 360px;
  }

  .image-preview-model {
    min-height: 360px;
    padding: 22px 16px 104px;
  }

  .image-stage {
    min-height: 230px;
  }

  .interactive-product-img {
    max-width: 88%;
    max-height: 220px;
  }

  .image-tools {
    top: 10px;
    right: 10px;
  }
}
</style>
