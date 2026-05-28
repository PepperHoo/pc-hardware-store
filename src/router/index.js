import {
  createRouter,
  createWebHistory
} from 'vue-router'

import HomeView from '../views/HomeView.vue'
import ProductsView from '../views/ProductsView.vue'
import CartView from '../views/CartView.vue'
import ProfileView from '../views/ProfileView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'

import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ApproveResetView from '../views/ApproveResetView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import AdminProductsView from '../views/AdminProductsView.vue'
import AdminOrdersView from '../views/AdminOrdersView.vue'
import AdminUsersView from '../views/AdminUsersView.vue'
import AdminOrderDetailView from '../views/AdminOrderDetailView.vue'
import AdminHomepageView from '../views/AdminHomepageView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import OrdersView from '../views/OrdersView.vue'
import PcBuilderView from '../views/PcBuilderView.vue'

const routes = [

  {
    path: '/',
    component: HomeView
  },

  {
    path: '/products',
    component: ProductsView
  },

  {
    path: '/pc-builder',
    component: PcBuilderView
  },

  {
    path: '/products/:category',
    component: ProductsView
  },

  {
    path: '/cart',
    component: CartView
  },

  {
    path: '/profile',
    component: ProfileView
  },

  {
    path: '/login',
    component: LoginView
  },

  {
    path: '/register',
    component: RegisterView
  },

  {
    path: '/forgot-password',
    component: ForgotPasswordView
  },

  {
    path: '/approve-reset',
    component: ApproveResetView
  },

  {
    path: '/reset-password',
    component: ResetPasswordView
  },

  {
    path: '/product/:id',

    component: () => import(
      '../views/ProductDetailView.vue'
    )
  },

  {
    path: '/checkout',
    component: CheckoutView
  },

  // ADMIN
  {
    path: '/admin',
    component: AdminDashboardView
  },

  {
    path: '/admin/products',
    component: AdminProductsView
  },

  {
    path: '/admin/orders',
    component: AdminOrdersView
  },

  {
    path: '/admin/users',
    component: AdminUsersView
  },

  {
    path: '/admin/orders/:id',
    component: AdminOrderDetailView
  },

  {
    path: '/admin/homepage',
    component: AdminHomepageView
  },

  {
    path: '/orders',
    component: OrdersView
  },

  {
    path: '/admin/profile',
    component: () =>
      import('../views/AdminProfileView.vue')
  }
]

const router = createRouter({

  history: createWebHistory(),

  routes,

  scrollBehavior() {

    return {

      top: 0,

      behavior: 'smooth'
    }
  }
})

router.beforeEach((to) => {

  const user = JSON.parse(
    localStorage.getItem('user')
  )

  if (
    to.path.startsWith('/admin') &&
    user?.role !== 'admin'
  ) {

    return user
      ? '/profile'
      : '/login'
  }

  if (
    to.path === '/profile' &&
    !user
  ) {

    return '/login'
  }

  return true
})

export default router
