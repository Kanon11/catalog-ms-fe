// Product CRUD against catalog-ms /products.
// Product shape: { id, name, price, description }. The http client attaches the JWT
// and throws ApiError on non-2xx (e.g. 403 if the role can't write).
import { http } from './http'

// Paginated. `page` is 1-based (page=1 is the first page) to match the API.
// Resolves to a PagedResponse:
//   { content: Product[], page, size, totalElements, totalPages, first, last }
export function listProducts(page = 1, size = 10) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return http.get(`/products?${params.toString()}`)
}

export function getProduct(id) {
  return http.get(`/products/${id}`)
}

// Create: server assigns the id, so send name/price/description only.
export function createProduct({ name, price, description }) {
  return http.post('/products', { name, price, description })
}

// Update: PUT replaces the product; send the full body including id.
export function updateProduct(id, { name, price, description }) {
  return http.put(`/products/${id}`, { id, name, price, description })
}

export function deleteProduct(id) {
  return http.delete(`/products/${id}`)
}
