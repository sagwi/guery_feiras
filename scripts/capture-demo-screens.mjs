/**
 * Captura um print de cada tela do Guery Feiras (produção) para demo de clientes.
 * Contas demo do runbook — só leitura/navegação.
 */
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = 'https://guery-feiras.vercel.app'
const OUT = '/opt/cursor/artifacts/demo-screens'
const VENDOR = { email: 'nathan.cruz@demo.gueryfeiras.dev', senha: 'Demo@123' }
const CURADOR = { email: 'curadoria.demo@gueryfeiras.dev', senha: 'Demo@123' }

mkdirSync(OUT, { recursive: true })

async function login(page, { email, senha }) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL(/\/(VendorPanel|curadoria)/, { timeout: 30_000 })
  await page.waitForTimeout(1200)
}

async function shot(page, name) {
  await page.waitForTimeout(800)
  const path = join(OUT, `${name}.png`)
  await page.screenshot({ path, fullPage: true })
  console.log('OK', name, '→', path)
}

async function logout(page) {
  // limpa sessão sem clicar em Sair (barra fixa inferior intercepta o botão)
  await page.context().clearCookies()
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
})
const page = await context.newPage()

// dispensa banner LGPD antes de qualquer tela (chave do CookieBanner)
await page.addInitScript(() => {
  localStorage.setItem('gf_cookies', '1')
})

try {
  // ——— Auth (público) ———
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await shot(page, '01-login')

  await page.goto(`${BASE}/signup`, { waitUntil: 'networkidle' })
  await shot(page, '02-signup')

  await page.goto(`${BASE}/recuperar-senha`, { waitUntil: 'networkidle' })
  await shot(page, '03-recuperar-senha')

  // ——— Comerciante ———
  await login(page, VENDOR)
  await shot(page, '04-vendor-painel')

  for (const [path, name] of [
    ['/VendorBusinesses', '05-vendor-negocios'],
    ['/VendorApply', '06-vendor-nova-inscricao'],
    ['/VendorPayments', '07-vendor-pagamentos'],
    ['/VendorWallet', '08-vendor-carteira'],
    ['/ChangePassword', '09-vendor-alterar-senha'],
    ['/VendorManual', '10-vendor-manual'],
  ]) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
    await shot(page, name)
  }

  await logout(page)

  // ——— Curadoria ———
  await login(page, CURADOR)
  await shot(page, '11-curadoria-cadastros')

  for (const [path, name] of [
    ['/curadoria/inscricoes', '12-curadoria-inscricoes'],
    ['/curadoria/feiras', '13-curadoria-feiras'],
    ['/curadoria/indicadores', '14-curadoria-indicadores'],
    ['/curadoria/suporte', '15-curadoria-suporte'],
  ]) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
    await shot(page, name)
  }

  // Detalhe da primeira feira (se existir link/card)
  await page.goto(`${BASE}/curadoria/feiras`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  const feiraLink = page.locator('a[href*="/curadoria/feiras/"]').first()
  if (await feiraLink.count()) {
    await feiraLink.click()
    await page.waitForURL(/\/curadoria\/feiras\/.+/, { timeout: 15_000 })
    await page.waitForTimeout(1200)
    await shot(page, '16-curadoria-feira-detalhe')
  } else {
    // fallback: botão/card clicável
    const card = page.locator('[class*="card"], button, a').filter({ hasText: /feira|editar|ver/i }).first()
    if (await card.count()) {
      await card.click()
      await page.waitForTimeout(1500)
      if (page.url().includes('/curadoria/feiras/')) {
        await shot(page, '16-curadoria-feira-detalhe')
      } else {
        console.log('SKIP 16-curadoria-feira-detalhe (não achou detalhe)')
      }
    } else {
      console.log('SKIP 16-curadoria-feira-detalhe (lista vazia)')
    }
  }
} catch (err) {
  console.error('FALHA', err)
  await page.screenshot({ path: join(OUT, 'erro.png'), fullPage: true }).catch(() => {})
  process.exitCode = 1
} finally {
  await browser.close()
}
