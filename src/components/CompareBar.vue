<script setup>
import { ref } from 'vue'
import { useCompareStore } from '../stores/compare'
import { useCurrencyStore } from '../stores/currency'

const compare  = useCompareStore()
const currency = useCurrencyStore()
const showModal = ref(false)

const specKeys = ['category', 'price', 'stock']
const specLabels = { category: 'Category', price: 'Price', stock: 'Stock' }
</script>

<template>
  <!-- Floating bar -->
  <Transition name="slide-up">
    <div v-if="compare.count > 0" class="compare-bar">
      <div class="bar-inner">
        <p class="bar-label">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 3l4 4-4 4" stroke="#60a5fa" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Comparing {{ compare.count }}/{{ compare.MAX }}
        </p>

        <div class="bar-items">
          <div v-for="item in compare.items" :key="item.id" class="bar-item">
            <img :src="item.image" :alt="item.name" class="bar-thumb" />
            <span class="bar-name">{{ item.name }}</span>
            <button class="bar-remove" @click="compare.remove(item.id)">✕</button>
          </div>

          <!-- Empty slots -->
          <div v-for="n in (compare.MAX - compare.count)" :key="`empty-${n}`" class="bar-slot">
            <span>Add product</span>
          </div>
        </div>

        <div class="bar-actions">
          <button class="btn-compare" @click="showModal = true" :disabled="compare.count < 2">
            Compare Now
          </button>
          <button class="btn-clear" @click="compare.clear()">Clear</button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Comparison Modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h2 class="modal-title">Product <span class="grad-text">Comparison</span></h2>
            <button class="modal-close" @click="showModal = false">✕</button>
          </div>

          <div class="compare-table-wrap">
            <table class="compare-table">
              <thead>
                <tr>
                  <th class="spec-col">Spec</th>
                  <th v-for="item in compare.items" :key="item.id" class="prod-col">
                    <div class="th-content">
                      <img :src="item.image" :alt="item.name" class="th-img" />
                      <p class="th-name">{{ item.name }}</p>
                      <button class="th-remove" @click="compare.remove(item.id)">Remove</button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="key in specKeys" :key="key">
                  <td class="spec-label">{{ specLabels[key] }}</td>
                  <td v-for="item in compare.items" :key="item.id" class="spec-val">
                    <template v-if="key === 'price'">
                      <span class="price-val">{{ currency.format(item[key]) }}</span>
                    </template>
                    <template v-else-if="key === 'stock'">
                      <span :class="['stock-val', item[key] <= 5 ? 'low' : 'ok']">
                        {{ item[key] <= 5 ? `⚠ Only ${item[key]} left` : `✓ ${item[key]} in stock` }}
                      </span>
                    </template>
                    <template v-else>{{ item[key] || '—' }}</template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Floating bar */
.compare-bar {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 500;
  background: rgba(3,7,18,0.95); backdrop-filter: blur(20px);
  border-top: 1px solid rgba(59,130,246,0.3);
  padding: 16px 24px;
}
.bar-inner { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.bar-label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #60a5fa; margin: 0; white-space: nowrap; font-family: 'Orbitron', sans-serif; letter-spacing: 0.04em; }
.bar-items { display: flex; gap: 12px; flex: 1; }
.bar-item { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 8px 12px; }
.bar-thumb { width: 36px; height: 36px; object-fit: contain; border-radius: 6px; background: rgba(255,255,255,0.03); }
.bar-name { font-size: 12px; color: #f1f5f9; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar-remove { background: none; border: none; color: #64748b; cursor: pointer; font-size: 12px; padding: 0; line-height: 1; transition: color 0.2s; }
.bar-remove:hover { color: #f87171; }
.bar-slot { display: flex; align-items: center; justify-content: center; width: 160px; border: 2px dashed rgba(255,255,255,0.08); border-radius: 10px; padding: 8px 12px; font-size: 12px; color: #334155; }
.bar-actions { display: flex; gap: 10px; }
.btn-compare { padding: 10px 20px; background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; border: none; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.3s; font-family: 'Orbitron', sans-serif; letter-spacing: 0.04em; white-space: nowrap; }
.btn-compare:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37,99,235,0.4); }
.btn-compare:disabled { opacity: 0.35; cursor: not-allowed; }
.btn-clear { padding: 10px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: #64748b; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.btn-clear:hover { color: #94a3b8; background: rgba(255,255,255,0.09); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-card { background: #0d1117; border: 1px solid rgba(255,255,255,0.1); border-radius: 28px; width: 100%; max-width: 900px; max-height: 85vh; overflow: hidden; display: flex; flex-direction: column; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 28px; border-bottom: 1px solid rgba(255,255,255,0.07); }
.modal-title { font-family: 'Orbitron', sans-serif; font-size: 20px; font-weight: 900; color: #f1f5f9; margin: 0; }
.modal-close { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.06); border: none; color: #64748b; font-size: 16px; cursor: pointer; transition: all 0.2s; }
.modal-close:hover { background: rgba(255,255,255,0.1); color: #f1f5f9; }

.compare-table-wrap { overflow: auto; padding: 24px 28px; }
.compare-table { width: 100%; border-collapse: collapse; }
.compare-table th, .compare-table td { padding: 14px 16px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: top; }
.spec-col { width: 130px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #334155; }
.prod-col { min-width: 200px; }
.th-content { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
.th-img { width: 80px; height: 80px; object-fit: contain; background: radial-gradient(circle, rgba(59,130,246,0.08), rgba(3,7,18,0.5)); border-radius: 12px; padding: 8px; box-sizing: border-box; }
.th-name { font-size: 13px; font-weight: 700; color: #f1f5f9; margin: 0; }
.th-remove { padding: 5px 12px; border-radius: 8px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #f87171; font-size: 11px; font-weight: 600; cursor: pointer; }
.spec-label { font-size: 13px; color: #64748b; font-weight: 600; }
.spec-val { font-size: 14px; color: #cbd5e1; }
.price-val { font-size: 16px; font-weight: 800; color: #60a5fa; }
.stock-val.ok  { color: #6ee7b7; font-size: 13px; font-weight: 600; }
.stock-val.low { color: #fcd34d; font-size: 13px; font-weight: 600; }

/* Transitions */
.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
