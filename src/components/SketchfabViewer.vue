<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  selectedParts: {
    type: Object,
    default: () => ({})
  }
})

const MODEL_ID = '1a24273417534f69afa0f7c62b643ffc'

// Embed URL — no api_version param, just a clean embed
const EMBED_URL =
  `https://sketchfab.com/models/${MODEL_ID}/embed` +
  `?autostart=1` +
  `&preload=1` +
  `&ui_theme=dark` +
  `&ui_infos=0` +
  `&ui_stop=0` +
  `&ui_watermark=1` +
  `&dnt=1`

const iframeRef = ref(null)
const isLoading = ref(true)

// Hide spinner once iframe fires its load event
function onLoad() {
  // Give the 3D scene a moment to render before hiding spinner
  setTimeout(() => { isLoading.value = false }, 1800)
}

onBeforeUnmount(() => {})
</script>

<template>
  <div class="sf-wrap">

    <!-- Header -->
    <div class="sf-header">
      <span class="sf-badge">3D Preview</span>
      <span class="sf-hint">Drag · Scroll · Pinch</span>
    </div>

    <!-- Spinner shown until iframe fires @load -->
    <transition name="fade">
      <div v-if="isLoading" class="sf-overlay">
        <div class="sf-spinner" />
        <p class="sf-step">Loading 3D model…</p>
      </div>
    </transition>

    <!-- Sketchfab embed — src set directly, no JS API conflicts -->
    <iframe
      ref="iframeRef"
      class="sf-iframe"
      :src="EMBED_URL"
      allow="autoplay; fullscreen; xr-spatial-tracking"
      allowfullscreen
      mozallowfullscreen="true"
      webkitallowfullscreen="true"
      frameborder="0"
      @load="onLoad"
    />

    <!-- Part selection chips -->
    <div class="sf-legend">
      <div
        v-for="(color, cat) in {
          motherboard: '#22c55e',
          processor:   '#3b82f6',
          ram:         '#8b5cf6',
          gpu:         '#f59e0b',
          storage:     '#06b6d4',
          psu:         '#ef4444',
          cooler:      '#60a5fa',
          casing:      '#94a3b8',
          rgb:         '#ff00ff'
        }"
        :key="cat"
        class="sf-chip"
        :class="{ active: selectedParts[cat] }"
      >
        <span class="sf-dot" :style="{ background: color }" />
        <span>{{ cat }}</span>
      </div>
    </div>

  </div>
</template>

<style scoped>
.sf-wrap {
  position: sticky;
  top: 92px;
  border-radius: 18px;
  overflow: hidden;
  background: #080d1a;
  border: 1px solid rgba(59,130,246,0.25);
  box-shadow: 0 24px 52px rgba(0,0,0,0.55);
  display: flex;
  flex-direction: column;
}

.sf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 13px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  flex-shrink: 0;
  background: rgba(255,255,255,0.02);
}

.sf-badge {
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(59,130,246,0.18);
  color: #93c5fd;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.sf-hint { color: #334155; font-size: 11px; }

/* Spinner overlay */
.sf-overlay {
  position: absolute;
  inset: 44px 0 54px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background: #080d1a;
  pointer-events: none;
}

.sf-spinner {
  width: 38px;
  height: 38px;
  border: 3px solid rgba(59,130,246,0.15);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

.sf-step { font-size: 13px; color: #475569; margin: 0; }

@keyframes spin { to { transform: rotate(360deg) } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.6s }
.fade-enter-from, .fade-leave-to       { opacity: 0 }

/* The 3D viewer */
.sf-iframe {
  width: 100%;
  height: 520px;
  border: none;
  display: block;
  flex-shrink: 0;
  background: #080d1a;
}

/* Part chips */
.sf-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 14px 12px;
  border-top: 1px solid rgba(255,255,255,0.05);
  background: rgba(255,255,255,0.01);
  flex-shrink: 0;
}

.sf-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid rgba(148,163,184,0.08);
  background: rgba(15,23,42,0.5);
  font-size: 10px;
  font-weight: 700;
  color: #2d3f55;
  text-transform: capitalize;
  transition: all 0.3s;
}

.sf-chip.active {
  color: #cbd5e1;
  border-color: rgba(148,163,184,0.25);
  background: rgba(30,41,59,0.95);
  box-shadow: 0 0 8px rgba(59,130,246,0.1);
}

.sf-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  opacity: 0.2;
  transition: all 0.3s;
  flex-shrink: 0;
}

.sf-chip.active .sf-dot {
  opacity: 1;
  box-shadow: 0 0 4px currentColor;
}
</style>
