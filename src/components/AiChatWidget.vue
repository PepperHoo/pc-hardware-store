<script setup>
import { computed, nextTick, ref } from 'vue'

const isOpen = ref(false)
const input = ref('')
const isSending = ref(false)
const errorMessage = ref('')
const messages = ref([
  {
    role: 'assistant',
    content: 'Hi, I can help you choose compatible PC parts, compare components, and plan a complete build.'
  }
])
const messagesEl = ref(null)

const quickPrompts = [
  'Build a gaming PC',
  'Check compatibility',
  'Recommend a GPU',
  'Explain this spec'
]

const canSend = computed(() => input.value.trim().length > 0 && !isSending.value)

function scrollToLatest() {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  })
}

function openWithPrompt(prompt) {
  isOpen.value = true
  input.value = prompt
  nextTick(() => {
    document.querySelector('.ai-chat-input')?.focus()
  })
}

async function sendMessage() {
  const content = input.value.trim()
  if (!content || isSending.value) return

  errorMessage.value = ''
  input.value = ''
  messages.value.push({ role: 'user', content })
  isSending.value = true
  scrollToLatest()

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.value.slice(-12)
      })
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.error || 'AI chat failed to respond.')
    }

    messages.value.push({
      role: 'assistant',
      content: data.reply || 'I could not generate a reply this time.'
    })
  } catch (error) {
    const message = error?.message || 'AI chat is not available right now.'
    errorMessage.value = message
    messages.value.push({
      role: 'assistant',
      content: `I cannot connect to the AI service yet. ${message}`
    })
  } finally {
    isSending.value = false
    scrollToLatest()
  }
}

function handleKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <div class="ai-chat">
    <Transition name="ai-panel">
      <section v-if="isOpen" class="ai-chat-panel" aria-label="AI PC assistant">
        <header class="ai-chat-header">
          <div>
            <p class="ai-eyebrow">AI Assistant</p>
            <h2>PC Build Helper</h2>
          </div>
          <button class="ai-icon-btn" type="button" aria-label="Close AI chat" @click="isOpen = false">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div ref="messagesEl" class="ai-chat-messages">
          <div
            v-for="(message, index) in messages"
            :key="`${message.role}-${index}`"
            :class="['ai-message', `ai-message--${message.role}`]"
          >
            <p>{{ message.content }}</p>
          </div>

          <div v-if="isSending" class="ai-message ai-message--assistant ai-message--loading">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <div class="ai-quick-row">
          <button
            v-for="prompt in quickPrompts"
            :key="prompt"
            class="ai-chip"
            type="button"
            @click="openWithPrompt(prompt)"
          >
            {{ prompt }}
          </button>
        </div>

        <p v-if="errorMessage" class="ai-error">{{ errorMessage }}</p>

        <form class="ai-chat-form" @submit.prevent="sendMessage">
          <textarea
            v-model="input"
            class="ai-chat-input"
            rows="2"
            placeholder="Ask about compatible PC parts..."
            @keydown="handleKeydown"
          ></textarea>
          <button class="ai-send-btn" type="submit" :disabled="!canSend" aria-label="Send AI chat message">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </form>
      </section>
    </Transition>

    <button
      class="ai-chat-toggle"
      type="button"
      :aria-expanded="isOpen"
      aria-label="Open AI PC assistant"
      @click="isOpen = !isOpen"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 8h10M7 12h7M9 19l-4 3v-4a4 4 0 0 1-3-4V7a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4h-7l-2 1Z" />
      </svg>
      <span>AI</span>
    </button>
  </div>
</template>

<style scoped>
.ai-chat {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 9000;
  font-family: 'Orbitron', 'Exo 2', 'Segoe UI', sans-serif;
}

.ai-chat-toggle,
.ai-icon-btn,
.ai-send-btn,
.ai-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ai-chat-toggle {
  gap: 8px;
  min-width: 70px;
  height: 52px;
  padding: 0 16px;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #60a5fa);
  box-shadow: 0 18px 34px rgba(37, 99, 235, 0.34);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.06em;
}

.ai-chat-toggle svg,
.ai-icon-btn svg,
.ai-send-btn svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ai-chat-panel {
  position: absolute;
  right: 0;
  bottom: 66px;
  width: min(390px, calc(100vw - 28px));
  height: min(620px, calc(100vh - 120px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(96, 165, 250, 0.26);
  border-radius: 22px;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 36%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(3, 7, 18, 0.98));
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.46);
  color: #f8fafc;
}

.ai-chat-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 18px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
}

.ai-eyebrow {
  margin: 0 0 5px;
  color: #60a5fa;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.ai-chat-header h2 {
  margin: 0;
  color: #f8fafc;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.1;
}

.ai-icon-btn {
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
}

.ai-chat-messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding: 16px;
}

.ai-message {
  max-width: 86%;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 14px;
  padding: 10px 12px;
  font-family: 'Exo 2', 'Segoe UI', sans-serif;
  font-size: 13px;
  line-height: 1.45;
}

.ai-message p {
  margin: 0;
  white-space: pre-wrap;
}

.ai-message--assistant {
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.06);
  color: #dbeafe;
}

.ai-message--user {
  align-self: flex-end;
  border-color: rgba(96, 165, 250, 0.42);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.92), rgba(14, 165, 233, 0.86));
  color: #fff;
}

.ai-message--loading {
  display: flex;
  gap: 5px;
  width: fit-content;
}

.ai-message--loading span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #93c5fd;
  animation: ai-pulse 1s ease-in-out infinite;
}

.ai-message--loading span:nth-child(2) { animation-delay: 0.12s; }
.ai-message--loading span:nth-child(3) { animation-delay: 0.24s; }

.ai-quick-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 16px 12px;
}

.ai-chip {
  flex: 0 0 auto;
  padding: 8px 10px;
  border: 1px solid rgba(96, 165, 250, 0.25);
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.1);
  color: #bfdbfe;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
}

.ai-error {
  margin: 0 16px 10px;
  padding: 8px 10px;
  border: 1px solid rgba(248, 113, 113, 0.28);
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.1);
  color: #fecaca;
  font-family: 'Exo 2', 'Segoe UI', sans-serif;
  font-size: 12px;
}

.ai-chat-form {
  display: grid;
  grid-template-columns: 1fr 44px;
  gap: 10px;
  padding: 14px 16px 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.14);
}

.ai-chat-input {
  width: 100%;
  min-height: 44px;
  max-height: 120px;
  resize: vertical;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.06);
  color: #f8fafc;
  padding: 10px 12px;
  font-family: 'Exo 2', 'Segoe UI', sans-serif;
  font-size: 13px;
  line-height: 1.35;
}

.ai-chat-input::placeholder {
  color: #64748b;
}

.ai-send-btn {
  width: 44px;
  height: 44px;
  border-radius: 13px;
  background: #3b82f6;
  color: #fff;
}

.ai-send-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

:global(:root[data-theme="light"]) .ai-chat-panel {
  border-color: rgba(59, 130, 246, 0.22);
  background:
    radial-gradient(circle at top left, rgba(96, 165, 250, 0.24), transparent 38%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(239, 246, 255, 0.98));
  box-shadow: 0 24px 54px rgba(15, 23, 42, 0.18);
  color: #172033;
}

:global(:root[data-theme="light"]) .ai-chat-header,
:global(:root[data-theme="light"]) .ai-chat-form {
  border-color: rgba(71, 85, 105, 0.14);
}

:global(:root[data-theme="light"]) .ai-chat-header h2 {
  color: #172033;
}

:global(:root[data-theme="light"]) .ai-message--assistant {
  background: #fff;
  color: #334155;
  border-color: rgba(71, 85, 105, 0.14);
}

:global(:root[data-theme="light"]) .ai-icon-btn,
:global(:root[data-theme="light"]) .ai-chip {
  background: rgba(37, 99, 235, 0.08);
  border-color: rgba(37, 99, 235, 0.18);
  color: #1d4ed8;
}

:global(:root[data-theme="light"]) .ai-chat-input {
  background: #fff !important;
  border-color: rgba(71, 85, 105, 0.18) !important;
  color: #172033 !important;
}

:global(:root[data-theme="light"]) .ai-chat-input::placeholder {
  color: #94a3b8 !important;
}

:global(:root[data-theme="light"]) .ai-error {
  background: #fff1f2;
  color: #be123c;
}

:global([data-theme="light"]) .ai-chat-panel {
  border-color: rgba(37, 99, 235, 0.22) !important;
  background:
    radial-gradient(circle at top left, rgba(96, 165, 250, 0.18), transparent 40%),
    linear-gradient(145deg, #ffffff, #eef6ff) !important;
  box-shadow: 0 24px 54px rgba(15, 23, 42, 0.18) !important;
  color: #172033 !important;
}

:global([data-theme="light"]) .ai-chat-header,
:global([data-theme="light"]) .ai-chat-form {
  border-color: rgba(71, 85, 105, 0.14) !important;
  background: rgba(255, 255, 255, 0.56) !important;
}

:global([data-theme="light"]) .ai-chat-messages {
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.28), rgba(239, 246, 255, 0.44)) !important;
}

:global([data-theme="light"]) .ai-eyebrow {
  color: #2563eb !important;
}

:global([data-theme="light"]) .ai-chat-header h2 {
  color: #172033 !important;
}

:global([data-theme="light"]) .ai-icon-btn {
  background: rgba(15, 23, 42, 0.04) !important;
  border-color: rgba(15, 23, 42, 0.12) !important;
  color: #334155 !important;
}

:global([data-theme="light"]) .ai-message--assistant {
  background: #ffffff !important;
  border-color: rgba(71, 85, 105, 0.16) !important;
  color: #334155 !important;
}

:global([data-theme="light"]) .ai-message--assistant p {
  color: #334155 !important;
}

:global([data-theme="light"]) .ai-message--user {
  border-color: rgba(37, 99, 235, 0.32) !important;
  background: linear-gradient(135deg, #2563eb, #38bdf8) !important;
  color: #ffffff !important;
}

:global([data-theme="light"]) .ai-message--user p {
  color: #ffffff !important;
}

:global([data-theme="light"]) .ai-chip {
  background: rgba(37, 99, 235, 0.08) !important;
  border-color: rgba(37, 99, 235, 0.22) !important;
  color: #1d4ed8 !important;
}

:global([data-theme="light"]) .ai-error {
  background: #fff1f2 !important;
  border-color: rgba(244, 63, 94, 0.24) !important;
  color: #be123c !important;
}

:global([data-theme="light"]) .ai-chat-input {
  background: #ffffff !important;
  border-color: rgba(71, 85, 105, 0.2) !important;
  color: #172033 !important;
}

:global([data-theme="light"]) .ai-chat-input::placeholder {
  color: #64748b !important;
}

:global([data-theme="light"]) .ai-send-btn {
  background: #2563eb !important;
  color: #ffffff !important;
}

.ai-panel-enter-active,
.ai-panel-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.ai-panel-enter-from,
.ai-panel-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

@keyframes ai-pulse {
  0%, 80%, 100% { opacity: 0.35; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-2px); }
}

@media (max-width: 640px) {
  .ai-chat {
    right: 14px;
    bottom: 14px;
  }

  .ai-chat-panel {
    right: -4px;
    bottom: 62px;
    width: calc(100vw - 24px);
    height: min(560px, calc(100vh - 96px));
    border-radius: 18px;
  }

  .ai-chat-toggle {
    min-width: 60px;
    height: 48px;
    padding: 0 14px;
  }
}
</style>
