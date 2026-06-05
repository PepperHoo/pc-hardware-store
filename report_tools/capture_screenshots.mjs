import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const runtimeRequire = createRequire(
  'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright/package.json'
)
const { chromium } = runtimeRequire('playwright')

const baseUrl = process.argv[2] || 'https://pc-hardware-store.vercel.app'
const outputDir = path.resolve('report_tools', 'screenshots')

const captures = [
  {
    name: 'home-desktop',
    path: '/',
    viewport: { width: 1440, height: 1000 },
    fullPage: false
  },
  {
    name: 'home-tablet',
    path: '/',
    viewport: { width: 820, height: 1180 },
    fullPage: false
  },
  {
    name: 'home-mobile',
    path: '/',
    viewport: { width: 390, height: 844 },
    fullPage: false
  },
  {
    name: 'products-desktop',
    path: '/products',
    viewport: { width: 1440, height: 1000 },
    fullPage: false
  },
  {
    name: 'products-mobile',
    path: '/products',
    viewport: { width: 390, height: 844 },
    fullPage: false
  },
  {
    name: 'pc-builder-desktop',
    path: '/pc-builder',
    viewport: { width: 1440, height: 1000 },
    fullPage: false
  },
  {
    name: 'pc-builder-mobile',
    path: '/pc-builder',
    viewport: { width: 390, height: 844 },
    fullPage: false
  },
  {
    name: 'admin-dashboard-desktop',
    path: '/admin',
    viewport: { width: 1440, height: 1000 },
    fullPage: false,
    admin: true
  },
  {
    name: 'admin-products-desktop',
    path: '/admin/products',
    viewport: { width: 1440, height: 1000 },
    fullPage: false,
    admin: true
  },
  {
    name: 'admin-dashboard-mobile',
    path: '/admin',
    viewport: { width: 390, height: 844 },
    fullPage: false,
    admin: true
  }
]

await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
})

try {
  for (const capture of captures) {
    const page = await browser.newPage({
      viewport: capture.viewport,
      deviceScaleFactor: 1
    })

    if (capture.admin) {
      await page.addInitScript(() => {
        localStorage.setItem('user', JSON.stringify({
          id: 1,
          username: 'Anson',
          email: 'admin@gmail.com',
          role: 'admin'
        }))
        localStorage.setItem('theme', 'dark')
      })
    }

    await page.goto(`${baseUrl}${capture.path}`, {
      waitUntil: 'networkidle',
      timeout: 60000
    })
    await page.waitForTimeout(2500)

    const filePath = path.join(outputDir, `${capture.name}.png`)
    await page.screenshot({ path: filePath, fullPage: capture.fullPage })
    console.log(`Captured ${filePath}`)
    await page.close()
  }
} finally {
  await browser.close()
}
