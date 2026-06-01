const KEY = 'recently_viewed'
const MAX = 6

export function useRecentlyViewed() {
  function addProduct(product) {
    const existing = getProducts()
    const filtered = existing.filter(p => p.id !== product.id)
    const updated  = [{ id: product.id, name: product.name, price: product.price, image: product.image, category: product.category }, ...filtered].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(updated))
  }

  function getProducts() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
    catch { return [] }
  }

  return { addProduct, getProducts }
}
