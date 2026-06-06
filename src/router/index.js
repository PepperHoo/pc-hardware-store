import { createRouter, createWebHistory } from 'vue-router'

import HomeView           from '../views/HomeView.vue'
import ProductsView       from '../views/ProductsView.vue'
import CartView           from '../views/CartView.vue'
import ProfileView        from '../views/ProfileView.vue'
import LoginView          from '../views/LoginView.vue'
import RegisterView       from '../views/RegisterView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ApproveResetView   from '../views/ApproveResetView.vue'
import ResetPasswordView  from '../views/ResetPasswordView.vue'
import ProductDetailView  from '../views/ProductDetailView.vue'
import WishlistView       from '../views/WishlistView.vue'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import AdminProductsView  from '../views/AdminProductsView.vue'
import AdminOrdersView    from '../views/AdminOrdersView.vue'
import AdminUsersView     from '../views/AdminUsersView.vue'
import AdminOrderDetailView from '../views/AdminOrderDetailView.vue'
import AdminProfileView   from '../views/AdminProfileView.vue'
import CheckoutView       from '../views/CheckoutView.vue'
import OrdersView         from '../views/OrdersView.vue'
import PcBuilderView      from '../views/PcBuilderView.vue'
import { clearSessionUser, getSessionUser } from '../lib/session.js'

const routes = [
  // ── Public ──────────────────────────────────────────────────
  { path: '/',                    component: HomeView,          meta: { requiresAuth: true } },
  { path: '/products',            component: ProductsView,      meta: { requiresAuth: true } },
  { path: '/products/:category',  component: ProductsView,      meta: { requiresAuth: true } },
  { path: '/product/:id',         component: ProductDetailView, meta: { requiresAuth: true } },
  { path: '/pc-builder',          component: PcBuilderView,     meta: { requiresAuth: true } },
  { path: '/login',               component: LoginView,    meta: { guestOnly: true } },
  { path: '/register',            component: RegisterView, meta: { guestOnly: true } },
  { path: '/forgot-password',     component: ForgotPasswordView },
  { path: '/approve-reset',       component: ApproveResetView },
  { path: '/reset-password',      component: ResetPasswordView },

  // ── Auth-required (user) ─────────────────────────────────────
  { path: '/cart',      component: CartView,     meta: { requiresAuth: true } },
  { path: '/checkout',  component: CheckoutView, meta: { requiresAuth: true } },
  { path: '/orders',    component: OrdersView,   meta: { requiresAuth: true } },
  { path: '/profile',   component: ProfileView,  meta: { requiresAuth: true } },
  { path: '/wishlist',  component: WishlistView, meta: { requiresAuth: true } },

  // ── Admin-only ───────────────────────────────────────────────
  { path: '/admin',              component: AdminDashboardView,  meta: { requiresAdmin: true } },
  { path: '/admin/products',     component: AdminProductsView,   meta: { requiresAdmin: true } },
  { path: '/admin/orders',       component: AdminOrdersView,     meta: { requiresAdmin: true } },
  { path: '/admin/orders/:id',   component: AdminOrderDetailView,meta: { requiresAdmin: true } },
  { path: '/admin/users',        component: AdminUsersView,      meta: { requiresAdmin: true } },
  { path: '/admin/homepage',     redirect: '/admin',             meta: { requiresAdmin: true } },
  { path: '/admin/profile',      component: AdminProfileView,    meta: { requiresAdmin: true } },

  // ── Catch-all 404 ────────────────────────────────────────────
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

function getStoredUser() {
  const user = getSessionUser()
  if (!user) clearSessionUser()
  return user
}

function getRole(user) {
  return String(user?.role || '').trim().toLowerCase()
}

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0, behavior: 'smooth' } }
})

router.beforeEach((to) => {
  const user = getStoredUser()
  const role = getRole(user)

  if (role === 'admin' && !to.path.startsWith('/admin')) {
    return '/admin'
  }

  // Admin-only routes
  if (to.meta.requiresAdmin) {
    if (!user)              return '/login'
    if (role !== 'admin') return '/profile'
  }

  // Auth-required routes
  if (to.meta.requiresAuth && !user) return '/login'

  // Guest-only routes (login/register redirect if already logged in)
  if (to.meta.guestOnly && user) return role === 'admin' ? '/admin' : '/profile'

  return true
})

export default router
