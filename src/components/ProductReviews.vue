<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({ productId: { type: String, required: true } })

const reviews    = ref([])
const loading    = ref(true)
const submitting = ref(false)
const myRating   = ref(0)
const myComment  = ref('')
const hoverStar  = ref(0)
const submitted  = ref(false)

const user = JSON.parse(localStorage.getItem('user') || 'null')

const avgRating = computed(() => {
  if (!reviews.value.length) return 0
  return (reviews.value.reduce((s, r) => s + r.rating, 0) / reviews.value.length).toFixed(1)
})

const ratingCounts = computed(() => {
  const counts = [0,0,0,0,0]
  reviews.value.forEach(r => { if (r.rating >= 1 && r.rating <= 5) counts[r.rating-1]++ })
  return counts.reverse() // 5→1
})

async function loadReviews() {
  try {
    loading.value = true
    const { getWhere } = await import('../lib/api.js')
    reviews.value = await getWhere('reviews', 'product_id', props.productId)
    reviews.value.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
    // Check if user already reviewed
    if (user) submitted.value = reviews.value.some(r => r.user_email === user.email)
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function submitReview() {
  if (!user)            return alert('Please login to leave a review.')
  if (!myRating.value)  return alert('Please select a star rating.')
  if (!myComment.value.trim()) return alert('Please write a comment.')
  try {
    submitting.value = true
    const { create } = await import('../lib/api.js')
    await create('reviews', {
      product_id:  props.productId,
      user_email:  user.email,
      username:    user.username || user.email,
      rating:      myRating.value,
      comment:     myComment.value.trim(),
      created_at:  new Date().toISOString()
    })
    submitted.value  = true
    myComment.value  = ''
    myRating.value   = 0
    loadReviews()
  } catch (e) {
    console.error(e)
    alert('Failed to submit review. Please try again.')
  } finally { submitting.value = false }
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-MY', { year:'numeric', month:'short', day:'numeric' })
}

onMounted(loadReviews)
</script>

<template>
  <section class="reviews-section">
    <h2 class="reviews-title">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1.5l2 4.5h4.5L12 9l1.5 4.5L9 11l-4.5 2.5L6 9 2.5 6H7z" stroke="#f59e0b" stroke-width="1.5" stroke-linejoin="round"/></svg>
      Customer Reviews
    </h2>

    <!-- Summary -->
    <div class="review-summary glass">
      <div class="avg-block">
        <p class="avg-num">{{ avgRating }}</p>
        <div class="avg-stars">
          <span v-for="s in 5" :key="s" class="star-icon" :class="{ filled: s <= Math.round(Number(avgRating)) }">★</span>
        </div>
        <p class="avg-count">{{ reviews.length }} review{{ reviews.length !== 1 ? 's' : '' }}</p>
      </div>
      <div class="rating-bars">
        <div v-for="(count, i) in ratingCounts" :key="i" class="bar-row">
          <span class="bar-label">{{ 5-i }}★</span>
          <div class="bar-track"><div class="bar-fill" :style="{ width: reviews.length ? (count/reviews.length*100)+'%' : '0%' }" /></div>
          <span class="bar-count">{{ count }}</span>
        </div>
      </div>
    </div>

    <!-- Write Review -->
    <div v-if="user && !submitted" class="write-review glass">
      <h3 class="wr-title">Write a Review</h3>
      <!-- Star picker -->
      <div class="star-picker">
        <button
          v-for="s in 5" :key="s"
          class="star-pick" :class="{ filled: s <= (hoverStar || myRating) }"
          @click="myRating = s" @mouseenter="hoverStar = s" @mouseleave="hoverStar = 0"
        >★</button>
      </div>
      <textarea v-model="myComment" placeholder="Share your experience with this product…" class="review-textarea" rows="4" />
      <button class="submit-btn" @click="submitReview" :disabled="submitting">
        {{ submitting ? 'Submitting…' : 'Submit Review' }}
      </button>
    </div>

    <div v-else-if="!user" class="login-prompt glass">
      <p>Please <router-link to="/login" class="login-link">log in</router-link> to leave a review.</p>
    </div>

    <div v-else-if="submitted" class="thanks-msg glass">
      ✅ Thank you for your review!
    </div>

    <!-- List -->
    <div class="reviews-list">
      <div v-if="loading" class="reviews-loading">Loading reviews…</div>
      <div v-else-if="reviews.length === 0" class="reviews-empty">No reviews yet. Be the first!</div>
      <div v-else v-for="r in reviews" :key="r.id" class="review-card glass">
        <div class="rc-header">
          <div class="rc-avatar">{{ (r.username||'U').charAt(0).toUpperCase() }}</div>
          <div>
            <p class="rc-user">{{ r.username || r.user_email }}</p>
            <p class="rc-date">{{ formatDate(r.created_at) }}</p>
          </div>
          <div class="rc-stars">
            <span v-for="s in 5" :key="s" class="star-icon" :class="{ filled: s <= r.rating }">★</span>
          </div>
        </div>
        <p class="rc-comment">{{ r.comment }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.reviews-section { margin-top: 60px; }
.reviews-title { display: flex; align-items: center; gap: 8px; font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 800; color: #f1f5f9; margin-bottom: 24px; letter-spacing: 0.04em; }

/* Summary */
.review-summary { display: flex; gap: 32px; padding: 24px 28px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.07); margin-bottom: 24px; flex-wrap: wrap; }
.avg-block { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.avg-num { font-family: 'Orbitron', sans-serif; font-size: 48px; font-weight: 900; color: #f1f5f9; margin: 0; line-height: 1; }
.avg-stars { display: flex; gap: 2px; }
.avg-count { font-size: 13px; color: #475569; margin: 0; }
.star-icon { font-size: 18px; color: #334155; transition: color 0.2s; }
.star-icon.filled { color: #f59e0b; }

.rating-bars { flex: 1; display: flex; flex-direction: column; gap: 8px; justify-content: center; min-width: 200px; }
.bar-row { display: flex; align-items: center; gap: 10px; }
.bar-label { font-size: 12px; color: #64748b; width: 24px; text-align: right; }
.bar-track { flex: 1; height: 8px; background: rgba(255,255,255,0.06); border-radius: 99px; overflow: hidden; }
.bar-fill { height: 100%; background: linear-gradient(90deg, #f59e0b, #fcd34d); border-radius: 99px; transition: width 0.6s cubic-bezier(0.16,1,0.3,1); }
.bar-count { font-size: 12px; color: #475569; width: 20px; }

/* Write review */
.write-review { padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.07); margin-bottom: 24px; }
.wr-title { font-size: 15px; font-weight: 700; color: #f1f5f9; margin: 0 0 16px; }
.star-picker { display: flex; gap: 6px; margin-bottom: 14px; }
.star-pick { font-size: 28px; background: none; border: none; cursor: pointer; color: #334155; transition: color 0.15s, transform 0.15s; }
.star-pick.filled { color: #f59e0b; }
.star-pick:hover { transform: scale(1.2); }
.review-textarea { width: 100%; padding: 12px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: #f1f5f9; font-size: 14px; resize: vertical; outline: none; box-sizing: border-box; font-family: inherit; margin-bottom: 14px; }
.review-textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.review-textarea::placeholder { color: #334155; }
.submit-btn { padding: 11px 24px; background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
.submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(37,99,235,0.35); }
.submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.login-prompt, .thanks-msg { padding: 16px 20px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.07); font-size: 14px; color: #64748b; margin-bottom: 20px; }
.login-link { color: #60a5fa; text-decoration: none; font-weight: 600; }
.thanks-msg { color: #6ee7b7; }

/* Review cards */
.reviews-list { display: flex; flex-direction: column; gap: 14px; }
.reviews-loading, .reviews-empty { color: #475569; font-size: 14px; padding: 20px 0; }
.review-card { padding: 20px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.07); }
.rc-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.rc-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #8b5cf6); color: white; font-size: 16px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.rc-user { font-size: 14px; font-weight: 700; color: #f1f5f9; margin: 0 0 2px; }
.rc-date { font-size: 12px; color: #475569; margin: 0; }
.rc-stars { display: flex; gap: 2px; margin-left: auto; }
.rc-comment { font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0; }
</style>
