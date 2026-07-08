// Carteira/crédito (§9). Fonte única do cálculo de saldo — usado no /VendorWallet e no PagamentoModal.
export type WalletTx = { tipo: 'entrada' | 'saida'; valor: number }

const somaPor = (txns: WalletTx[], tipo: WalletTx['tipo']): number =>
  txns.filter((t) => t.tipo === tipo).reduce((acc, t) => acc + Number(t.valor), 0)

export const totalRecebido = (txns: WalletTx[]): number => somaPor(txns, 'entrada')
export const totalUtilizado = (txns: WalletTx[]): number => somaPor(txns, 'saida')
export const saldo = (txns: WalletTx[]): number => totalRecebido(txns) - totalUtilizado(txns)

// Crédito cobre o valor? (usa >= p/ permitir abater exatamente o saldo).
export const temCredito = (txns: WalletTx[], valor: number): boolean => saldo(txns) >= valor
