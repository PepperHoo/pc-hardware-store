<script setup>
import {
  ref,
  defineExpose
} from 'vue'

const showToast = ref(false)

const toastMessage = ref('')

const toastType = ref('success')

// SHOW TOAST
function showToastMessage(
  message,
  type = 'success'
) {

  toastMessage.value =
    message

  toastType.value =
    type

  showToast.value = true

  setTimeout(() => {

    showToast.value = false

  }, 2500)
}

// EXPOSE FUNCTION
defineExpose({

  showToastMessage
})
</script>

<template>

  <transition name="toast">

    <div
      v-if="showToast"
      class="toast"
      :class="toastType"
    >

      <!-- ICON -->
      <span class="toast-icon">

        <template
          v-if="
            toastType ===
            'success'
          "
        >
          ✅
        </template>

        <template
          v-else-if="
            toastType ===
            'error'
          "
        >
          ❌
        </template>

        <template
          v-else
        >
          ℹ️
        </template>

      </span>

      <!-- MESSAGE -->
      <span
        class="
          toast-message
        "
      >

        {{ toastMessage }}

      </span>

    </div>

  </transition>

</template>

<style scoped>
/* TOAST */
.toast {

  position: fixed;

  bottom: 30px;

  right: 30px;

  min-width: 260px;

  max-width: 420px;

  padding: 16px 22px;

  border-radius: 18px;

  display: flex;

  align-items: center;

  gap: 12px;

  color: white;

  font-weight: 600;

  font-size: 15px;

  z-index: 99999;

  box-shadow:
    0 14px 28px
    rgba(0,0,0,0.18);
}

/* SUCCESS */
.success {

  background:
    linear-gradient(
      135deg,
      #2563eb,
      #3b82f6
    );
}

/* ERROR */
.error {

  background:
    linear-gradient(
      135deg,
      #ef4444,
      #dc2626
    );
}

/* INFO */
.info {

  background:
    linear-gradient(
      135deg,
      #6366f1,
      #4f46e5
    );
}

/* ICON */
.toast-icon {

  font-size: 18px;
}

/* MESSAGE */
.toast-message {

  flex: 1;

  line-height: 1.5;
}

/* ANIMATION */
.toast-enter-active,
.toast-leave-active {

  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {

  opacity: 0;

  transform:
    translateY(20px)
    scale(0.95);
}
</style>