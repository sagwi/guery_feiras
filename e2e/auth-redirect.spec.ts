import { test, expect } from '@playwright/test'

// Trava as duas regressões reais encontradas em produção nesta sessão:
// 1) login não respeitava o papel do usuário (curador caía no painel de comerciante)
// 2) o menu lateral marcava mais de um item como ativo ao mesmo tempo
//
// Contas de demo dedicadas (não interferem em dados de comerciantes reais).

async function login(page: import('@playwright/test').Page, email: string, senha: string) {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

test('curador é redirecionado para /curadoria e vê só um item ativo no menu', async ({ page }) => {
  await login(page, 'curadoria.demo@gueryfeiras.dev', 'Demo@123')
  await expect(page).toHaveURL(/\/curadoria$/)

  const nav = page.locator('nav')
  await expect(nav.getByRole('link', { name: 'Cadastros' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Inscrições' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Indicadores' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Suporte' })).toBeVisible()

  // só "Cadastros" deve estar marcado como ativo (classe de destaque do Sidebar)
  const ativos = nav.locator('a.font-semibold')
  await expect(ativos).toHaveCount(1)
  await expect(ativos.first()).toHaveText('Cadastros')
})

test('comerciante é redirecionado para /VendorPanel', async ({ page }) => {
  await login(page, 'nathan.cruz@demo.gueryfeiras.dev', 'Demo@123')
  await expect(page).toHaveURL(/\/VendorPanel$/)
  await expect(page.locator('nav').getByRole('link', { name: 'Painel' })).toBeVisible()
})
