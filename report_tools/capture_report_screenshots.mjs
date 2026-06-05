import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);
const bundledNodeModules = path.join(
  os.homedir(),
  '.cache',
  'codex-runtimes',
  'codex-primary-runtime',
  'dependencies',
  'node',
  'node_modules',
);
process.env.NODE_PATH = [
  path.join(bundledNodeModules, '.pnpm', 'node_modules'),
  bundledNodeModules,
  process.env.NODE_PATH || '',
].filter(Boolean).join(path.delimiter);
Module._initPaths();

const { chromium } = require('playwright');

const baseUrl = 'http://127.0.0.1:5173';
const outDir = path.resolve('report_tools', 'screenshots_report');
fs.mkdirSync(outDir, { recursive: true });

const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

const user = {
  id: 2,
  username: 'Anson',
  email: 'ansonhzx6@gmail.com',
  role: 'user',
};

const admin = {
  id: 1,
  username: 'Anson',
  email: 'admin@gmail.com',
  role: 'admin',
};

const products = db.products.map((product, index) => ({
  id: product.id || `product-${index + 1}`,
  name: product.name || `Component ${index + 1}`,
  price: Number(product.price || 0),
  category: product.category || 'component',
  image: product.image || '',
  description: product.description || product.details || 'Premium PC hardware component.',
  stock: Number(product.stock ?? 10),
}));

const homepage = {
  id: 'homepage',
  hotSelling: Array.isArray(db.homepage?.hotSelling) && db.homepage.hotSelling.length
    ? db.homepage.hotSelling
    : products.slice(0, 4),
  latestProducts: Array.isArray(db.homepage?.latestProducts) && db.homepage.latestProducts.length
    ? db.homepage.latestProducts
    : products.slice(-4),
};

const userOrderProduct = products[0];
const orders = [
  {
    id: '5',
    userEmail: user.email,
    recipientName: 'Anson',
    phoneNumber: '+60 12-345 6789',
    shippingAddress: 'Swinburne Sarawak',
    shippingMethod: 'standard',
    paymentMethod: 'cod',
    status: 'Pending',
    total: Number(userOrderProduct.price || 0) * 2,
    items: [
      {
        id: userOrderProduct.id,
        name: userOrderProduct.name,
        image: userOrderProduct.image,
        price: userOrderProduct.price,
        quantity: 2,
      },
    ],
  },
  ...(db.orders || []).map((order, index) => ({
    id: String(order.id || index + 1),
    status: order.status || 'Pending',
    total: Number(order.total || order.items?.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0) || 0),
    ...order,
  })),
];

const users = (db.users || []).map((entry) => ({ ...entry }));
let cartItems = [
  {
    user_email: user.email,
    product_id: String(products[0].id),
    product_data: { ...products[0] },
    quantity: 1,
    updated_at: new Date().toISOString(),
  },
];
let wishlistItems = [
  {
    user_email: user.email,
    product_id: String(products[1].id),
    product_data: { ...products[1] },
    updated_at: new Date().toISOString(),
  },
];
let reviews = [];

function tableRows(table) {
  const tables = {
    products,
    homepage: [homepage],
    orders,
    users,
    cart_items: cartItems,
    wishlist_items: wishlistItems,
    reviews,
    passwordResets: [],
  };
  return tables[table] || [];
}

function applySupabaseFilters(rows, url) {
  let filtered = [...rows];
  for (const [field, value] of url.searchParams.entries()) {
    if (['select', 'order', 'limit', 'on_conflict'].includes(field)) continue;
    if (value.startsWith('eq.')) {
      const expected = value.slice(3);
      filtered = filtered.filter((row) => String(row[field]) === expected);
    }
  }
  return filtered;
}

function upsertRows(table, row) {
  if (table === 'cart_items') {
    cartItems = cartItems.filter((item) => (
      String(item.user_email) !== String(row.user_email) ||
      String(item.product_id) !== String(row.product_id)
    ));
    cartItems.push(row);
  }

  if (table === 'wishlist_items') {
    wishlistItems = wishlistItems.filter((item) => (
      String(item.user_email) !== String(row.user_email) ||
      String(item.product_id) !== String(row.product_id)
    ));
    wishlistItems.push(row);
  }

  if (table === 'reviews') reviews.push(row);
}

async function installScreenshotRoutes(context) {
  await context.route('**/api/exchange-rates', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        provider: 'Screenshot market feed',
        live: true,
        stale: false,
        updatedAt: new Date().toISOString(),
        rates: { MYR: 1, YEN: 33, WON: 290, USD: 0.21, SGD: 0.29, EUR: 0.20 },
      }),
    });
  });

  await context.route('**/api/pc-recommendations', async (route) => {
    const payload = route.request().postDataJSON();
    const selected = payload?.selectedParts || {};
    const recommendationMap = {};
    const reasons = {};

    for (const category of payload?.categories || []) {
      if (selected[category.key]) continue;
      const choices = products
        .filter((product) => product.category === category.key)
        .slice(0, 3);
      recommendationMap[category.key] = choices.map((product) => product.id);
      reasons[category.key] = Object.fromEntries(
        choices.map((product) => [product.id, 'Compatible with the current selected component.']),
      );
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        provider: 'Smart recommendations',
        model: 'catalog compatibility',
        recommendations: recommendationMap,
        reasons,
      }),
    });
  });

  await context.route('https://qmrhibrvgswkeheinlxd.supabase.co/rest/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const table = url.pathname.split('/').pop();
    const method = request.method();

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(applySupabaseFilters(tableRows(table), url)),
      });
      return;
    }

    if (method === 'POST') {
      const row = request.postDataJSON();
      upsertRows(table, row);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([row]),
      });
      return;
    }

    if (method === 'PATCH') {
      const patch = request.postDataJSON();
      const rows = applySupabaseFilters(tableRows(table), url);
      rows.forEach((row) => Object.assign(row, patch));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(rows),
      });
      return;
    }

    if (method === 'DELETE') {
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    await route.fallback();
  });
}

async function makeContext(browser, sessionUser, theme = 'dark', viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
  });

  await installScreenshotRoutes(context);

  await context.addInitScript(() => {
    window.Chart = class ScreenshotChart {
      constructor(canvas, config = {}) {
        this.canvas = canvas;
        this.config = config;
        this.draw();
      }

      destroy() {}

      draw() {
        const ctx = this.canvas?.getContext?.('2d');
        if (!ctx) return;
        const width = this.canvas.clientWidth || this.canvas.width || 600;
        const height = this.canvas.clientHeight || this.canvas.height || 220;
        this.canvas.width = width;
        this.canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.lineWidth = 2;
        ctx.font = '12px sans-serif';
        const labels = this.config.data?.labels || [];
        const dataset = this.config.data?.datasets?.[0] || {};
        const values = dataset.data || [];

        if (this.config.type === 'doughnut') {
          const total = values.reduce((sum, value) => sum + Number(value || 0), 0) || 1;
          let angle = -Math.PI / 2;
          const cx = width / 2;
          const cy = height / 2 - 10;
          const radius = Math.min(width, height) * 0.28;
          const colors = dataset.backgroundColor || ['#3b82f6', '#f59e0b', '#10b981'];
          values.forEach((value, index) => {
            const next = angle + (Number(value || 0) / total) * Math.PI * 2;
            ctx.beginPath();
            ctx.strokeStyle = colors[index % colors.length];
            ctx.lineWidth = Math.max(18, radius * 0.28);
            ctx.arc(cx, cy, radius, angle, next);
            ctx.stroke();
            angle = next;
          });
          labels.forEach((label, index) => {
            ctx.fillStyle = colors[index % colors.length];
            ctx.fillRect(28 + index * 110, height - 32, 22, 8);
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(label, 56 + index * 110, height - 24);
          });
          return;
        }

        const max = Math.max(...values.map(Number), 1);
        const left = 46;
        const top = 26;
        const chartWidth = width - 70;
        const chartHeight = height - 64;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i += 1) {
          const y = top + (chartHeight / 4) * i;
          ctx.beginPath();
          ctx.moveTo(left, y);
          ctx.lineTo(left + chartWidth, y);
          ctx.stroke();
        }

        if (this.config.type === 'bar') {
          const barWidth = chartWidth / Math.max(values.length, 1) * 0.56;
          values.forEach((value, index) => {
            const x = left + index * (chartWidth / values.length) + barWidth * 0.35;
            const barHeight = (Number(value || 0) / max) * chartHeight;
            const gradient = ctx.createLinearGradient(0, top, 0, top + chartHeight);
            gradient.addColorStop(0, ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'][index % 4]);
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0.35)');
            ctx.fillStyle = gradient;
            ctx.fillRect(x, top + chartHeight - barHeight, barWidth, barHeight);
            ctx.fillStyle = '#64748b';
            ctx.fillText(labels[index] || '', x, height - 16);
          });
          return;
        }

        ctx.strokeStyle = '#3b82f6';
        ctx.fillStyle = 'rgba(59, 130, 246, 0.14)';
        ctx.beginPath();
        values.forEach((value, index) => {
          const x = left + index * (chartWidth / Math.max(values.length - 1, 1));
          const y = top + chartHeight - (Number(value || 0) / max) * chartHeight;
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        values.forEach((value, index) => {
          const x = left + index * (chartWidth / Math.max(values.length - 1, 1));
          const y = top + chartHeight - (Number(value || 0) / max) * chartHeight;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#60a5fa';
          ctx.fill();
          ctx.fillStyle = '#64748b';
          ctx.fillText(labels[index] || '', x - 8, height - 16);
        });
      }
    };
  });

  await context.addInitScript(({ sessionUser, theme }) => {
    localStorage.setItem('user', JSON.stringify(sessionUser));
    localStorage.setItem('theme', theme);
    localStorage.setItem('currency', 'MYR');
    document.documentElement.setAttribute('data-theme', theme);
  }, { sessionUser, theme });

  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  return { context, page };
}

async function goto(page, route, waitMs = 1400) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(waitMs);
}

async function setViewport(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(500);
}

async function capture(page, name) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  if (name.includes('admin-dashboard')) {
    await page.evaluate(() => {
      const canvases = Array.from(document.querySelectorAll('canvas'));
      canvases.forEach((canvas, index) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.parentElement?.getBoundingClientRect?.();
        const width = Math.max(320, Math.floor(rect?.width || canvas.clientWidth || 600));
        const height = Math.max(180, Math.floor(rect?.height || canvas.clientHeight || 220));
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.font = '12px sans-serif';

        if (index === 1) {
          const cx = width / 2;
          const cy = height / 2 - 6;
          const radius = Math.min(width, height) * 0.24;
          const colors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444'];
          let angle = -Math.PI / 2;
          [2, 1, 1, 0.5, 0.5].forEach((value, colorIndex) => {
            const next = angle + (value / 5) * Math.PI * 2;
            ctx.beginPath();
            ctx.lineWidth = Math.max(18, radius * 0.32);
            ctx.strokeStyle = colors[colorIndex];
            ctx.arc(cx, cy, radius, angle, next);
            ctx.stroke();
            angle = next;
          });
          ['Pending', 'Processing', 'Shipping', 'Delivered', 'Rejected'].forEach((label, labelIndex) => {
            const x = 22 + labelIndex * 92;
            ctx.fillStyle = colors[labelIndex];
            ctx.fillRect(x, height - 28, 18, 7);
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(label, x + 24, height - 21);
          });
          return;
        }

        const values = index === 2 ? [8, 4, 8, 6, 2, 4, 4, 4] : [0, 0, 0, 0, 0, 31010];
        const labels = index === 2
          ? ['Processor', 'Motherboard', 'Gpu', 'Ram', 'Storage', 'Psu', 'Cooler', 'Casing']
          : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const max = Math.max(...values, 1);
        const left = 42;
        const top = 24;
        const chartWidth = width - 70;
        const chartHeight = height - 58;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
        ctx.lineWidth = 1;
        for (let grid = 0; grid <= 4; grid += 1) {
          const y = top + (chartHeight / 4) * grid;
          ctx.beginPath();
          ctx.moveTo(left, y);
          ctx.lineTo(left + chartWidth, y);
          ctx.stroke();
        }

        if (index === 2) {
          const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#a855f7', '#06b6d4', '#ef4444', '#38bdf8', '#94a3b8'];
          const barStep = chartWidth / values.length;
          values.forEach((value, valueIndex) => {
            const barHeight = (value / max) * chartHeight;
            ctx.fillStyle = colors[valueIndex % colors.length];
            ctx.fillRect(left + valueIndex * barStep + 14, top + chartHeight - barHeight, barStep * 0.62, barHeight);
            ctx.fillStyle = '#64748b';
            ctx.fillText(labels[valueIndex], left + valueIndex * barStep + 4, height - 14);
          });
          return;
        }

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        values.forEach((value, valueIndex) => {
          const x = left + valueIndex * (chartWidth / Math.max(values.length - 1, 1));
          const y = top + chartHeight - (value / max) * chartHeight;
          if (valueIndex === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        values.forEach((value, valueIndex) => {
          const x = left + valueIndex * (chartWidth / Math.max(values.length - 1, 1));
          const y = top + chartHeight - (value / max) * chartHeight;
          ctx.beginPath();
          ctx.fillStyle = '#60a5fa';
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#64748b';
          ctx.fillText(labels[valueIndex], x - 8, height - 14);
        });
      });
    });
  }
  await page.screenshot({
    path: path.join(outDir, name),
    fullPage: false,
    animations: 'disabled',
  });
  console.log(name);
}

async function clickFirst(page, selectors, waitMs = 1000) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.count()) {
      await locator.scrollIntoViewIfNeeded().catch(() => {});
      await locator.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(waitMs);
      return true;
    }
  }
  return false;
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--disable-gpu',
      '--disable-gpu-sandbox',
      '--disable-gpu-compositing',
      '--in-process-gpu',
      '--no-first-run',
      '--disable-extensions',
    ],
  });

  try {
    const { context: userContext, page: userPage } = await makeContext(browser, user, 'dark');

    await goto(userPage, '/');
    await capture(userPage, '01-home-desktop.png');
    await setViewport(userPage, 820, 1180);
    await goto(userPage, '/');
    await capture(userPage, '02-home-tablet.png');
    await setViewport(userPage, 390, 844);
    await goto(userPage, '/');
    await capture(userPage, '03-home-mobile.png');

    await setViewport(userPage, 1440, 1000);
    await goto(userPage, '/products');
    await capture(userPage, '04-products-desktop.png');
    await setViewport(userPage, 390, 844);
    await goto(userPage, '/products');
    await capture(userPage, '05-products-mobile.png');

    await setViewport(userPage, 1440, 1000);
    await goto(userPage, '/products');
    await clickFirst(userPage, ['.p-card .p-name', '.p-card a', '.p-card'], 1800);
    await capture(userPage, '06-product-detail-desktop.png');

    await goto(userPage, '/pc-builder');
    await capture(userPage, '07-pc-builder-desktop.png');
    await setViewport(userPage, 390, 844);
    await goto(userPage, '/pc-builder');
    await capture(userPage, '08-pc-builder-mobile.png');

    await setViewport(userPage, 1440, 1000);
    await goto(userPage, '/products');
    await clickFirst(userPage, [
      '.p-card .btn-cart-compact',
      '.p-card .btn-add-cart',
      '.p-card button:has-text("Add to Cart")',
    ], 1200);
    await goto(userPage, '/cart');
    await capture(userPage, '09-cart-desktop.png');
    await goto(userPage, '/checkout');
    await capture(userPage, '10-checkout-desktop.png');

    await goto(userPage, '/products');
    await clickFirst(userPage, [
      '.p-card .card-quick-actions .quick-btn',
      '.p-card .wishlist-btn',
      'button[aria-label*="wish" i]',
    ], 1200);
    await goto(userPage, '/wishlist');
    await capture(userPage, '11-wishlist-desktop.png');

    await goto(userPage, '/profile');
    await capture(userPage, '12-profile-desktop.png');
    await goto(userPage, '/orders');
    await capture(userPage, '13-order-history-desktop.png');
    await userContext.close();

    const { context: adminContext, page: adminPage } = await makeContext(browser, admin, 'dark');
    await goto(adminPage, '/admin');
    await capture(adminPage, '14-admin-dashboard-desktop.png');
    await setViewport(adminPage, 390, 844);
    await goto(adminPage, '/admin');
    await capture(adminPage, '15-admin-dashboard-mobile.png');

    await setViewport(adminPage, 1440, 1000);
    await goto(adminPage, '/admin/products');
    await capture(adminPage, '16-admin-products-desktop.png');
    await setViewport(adminPage, 390, 844);
    await goto(adminPage, '/admin/products');
    await capture(adminPage, '17-admin-products-mobile.png');

    await setViewport(adminPage, 1440, 1000);
    await goto(adminPage, '/admin/orders');
    await capture(adminPage, '18-admin-orders-desktop.png');
    await goto(adminPage, '/admin/users');
    await capture(adminPage, '19-admin-users-desktop.png');
    await goto(adminPage, '/admin/homepage');
    await capture(adminPage, '20-admin-homepage-desktop.png');
    await goto(adminPage, '/admin/profile');
    await capture(adminPage, '21-admin-profile-desktop.png');
    await adminContext.close();
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
