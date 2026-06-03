<script setup>
import { ref, defineExpose } from 'vue'

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

let hideTimer

function closeToast() {
  showToast.value = false
}

function showToastMessage(message, type = 'success') {
  clearTimeout(hideTimer)

  toastMessage.value = message
  toastType.value = type
  showToast.value = true

  hideTimer = setTimeout(closeToast, 3200)
}

defineExpose({
  showToastMessage,
  closeToast
})
</script>

<template>
  <transition name="toast">
    <div
      v-if="showToast"
      class="toast"
      :class="toastType"
      role="status"
      aria-live="polite"
    >
      <span class="toast-icon" aria-hidden="true">
        <svg
          v-if="toastType === 'success'"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M5 12.5l4 4L19 7"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <svg
          v-else-if="toastType === 'error'"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M8 8l8 8M16 8l-8 8"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 10v7M12 7h.01"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          />
        </svg>
      </span>

      <span class="toast-message">{{ toastMessage }}</span>

      <button
        type="button"
        class="toast-close"
        aria-label="Close notification"
        @click="closeToast"
      >
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M8 8l8 8M16 8l-8 8"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>
  </transition>
</template>

<style scoped>
.toast {
  --toast-accent: #3b82f6;
  position: fixed;
  top: 84px;
  right: 24px;
  z-index: 99999;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  width: min(420px, calc(100vw - 32px));
  min-height: 58px;
  padding: 12px 12px 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-left: 4px solid var(--toast-accent);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.96);
  color: #e5edff;
  box-shadow: 0 18px 40px rgba(2, 6, 23, 0.32);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
}

.toast.success {
  --toast-accent: #3b82f6;
}

.toast.error {
  --toast-accent: #ef4444;
}

.toast.info {
  --toast-accent: #8b5cf6;
}

.toast-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--toast-accent) 18%, transparent);
  color: var(--toast-accent);
  flex-shrink: 0;
}

.toast-icon svg,
.toast-close svg {
  width: 18px;
  height: 18px;
}

.toast-message {
  min-width: 0;
  color: inherit;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.toast-close {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 10px;
  background: rgba(148, 163, 184, 0.10);
  color: #cbd5e1;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.toast-close:hover {
  background: rgba(148, 163, 184, 0.18);
  color: #ffffff;
}

:global([data-theme="light"]) .toast {
  background: rgba(255, 255, 255, 0.96);
  border-color: rgba(15, 23, 42, 0.10);
  color: #172033;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.16);
}

:global([data-theme="light"]) .toast-close {
  background: rgba(15, 23, 42, 0.06);
  color: #475569;
}

:global([data-theme="light"]) .toast-close:hover {
  background: rgba(15, 23, 42, 0.10);
  color: #0f172a;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

@media (max-width: 900px) {
  .toast {
    top: 72px;
    left: 50%;
    right: auto;
    width: calc(100vw - 24px);
    max-width: 430px;
    min-height: 54px;
    padding: 11px 10px 11px 12px;
    border-radius: 15px;
    transform: translateX(-50%);
  }

  .toast-enter-from,
  .toast-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px) scale(0.98);
  }
}

@media (max-width: 520px) {
  .toast {
    top: 64px;
    gap: 10px;
  }

  .toast-icon {
    width: 30px;
    height: 30px;
    border-radius: 10px;
  }

  .toast-message {
    font-size: 12px;
  }

  .toast-close {
    width: 30px;
    height: 30px;
  }
}
</style>
