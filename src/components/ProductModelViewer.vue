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

      <div v-else class="image-preview-model">
        <img v-if="imagePreviewUrl" :src="imagePreviewUrl" :alt="product.name" />
        <div v-else class="image-preview-missing">No product image available</div>
        <div class="image-preview-note">
          <span>Actual Product Image</span>
          <p>Add a GLB, GLTF, USDZ, or Sketchfab URL for a true rotating 3D model.</p>
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
}

.image-preview-model img {
  max-width: min(78%, 680px);
  max-height: 380px;
  object-fit: contain;
  filter: drop-shadow(0 28px 36px rgba(0, 0, 0, 0.4));
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

  .image-preview-model img {
    max-width: 88%;
    max-height: 220px;
  }
}
</style>
