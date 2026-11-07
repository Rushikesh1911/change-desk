// Mobile only shows sku and price, so it is NOT affected by the qty rename.
export function renderCart(cart: { items: { sku: string; price: number }[] }) {
  return cart.items.map((i) => `${i.sku}: ${i.price}`);
}

