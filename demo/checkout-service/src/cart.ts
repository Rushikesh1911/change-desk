// Checkout reads qty directly, so the rename will break it.
export function cartTotal(cart: { items: { sku: string; qty: number; price: number }[] }) {
  return cart.items.reduce((sum, item) => sum + item.qty * item.price, 0);
}

export function itemCount(cart: { items: { qty: number }[] }) {
  return cart.items.reduce((n, item) => n + item.qty, 0);
}
