import { test, expect } from '@playwright/test'

async function loginCurador(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill('curadoria.demo@gueryfeiras.dev')
  await page.locator('input[type="password"]').fill('Demo@123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/curadoria/)
}

test('curadoria hifi: shell + Cadastros + Inscrições + Feiras', async ({ page }) => {
  await loginCurador(page)

  await expect(page.getByText('PAINEL DO CURADOR')).toBeVisible()

  // 1d Cadastros
  await expect(page.getByRole('heading', { name: /Cadastros|pendentes|aprov/i }).first()).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByPlaceholder(/Buscar/i).first()).toBeVisible()

  // 1b Inscrições
  await page.getByRole('link', { name: 'Inscrições' }).click()
  await expect(page).toHaveURL(/\/curadoria\/inscricoes/)
  await expect(page.getByRole('heading', { name: /Inscrições pendentes/i })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByRole('button', { name: 'Todos' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pendente' })).toBeVisible()

  // 2a Gestão de Feiras
  await page.getByRole('link', { name: 'Feiras' }).click()
  await expect(page).toHaveURL(/\/curadoria\/feiras/)
  await expect(page.getByRole('heading', { name: 'Minhas feiras' })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: /Nova feira/i }).click()
  await expect(page.getByText('Nova feira', { exact: true }).last()).toBeVisible()
  await expect(page.getByRole('button', { name: /Salvar rascunho/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Publicar feira/i })).toBeVisible()
})
