// Book CRUD against catalog-ms /books.
// Book shape: { id, title, author, isbn, price, description }. The http client
// attaches the JWT and throws ApiError on non-2xx (e.g. 403 if the role can't write).
import { http } from './http'

// Paginated. `page` is 1-based (page=1 is the first page) to match the API.
// Resolves to a PagedResponse:
//   { content: Book[], page, size, totalElements, totalPages, first, last }
export function listBooks(page = 1, size = 10) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return http.get(`/books?${params.toString()}`)
}

export function getBook(id) {
  return http.get(`/books/${id}`)
}

// Create: server assigns the id, so send the fields only.
export function createBook({ title, author, isbn, price, description }) {
  return http.post('/books', { title, author, isbn, price, description })
}

// Update: PUT replaces the book; send the full body including id.
export function updateBook(id, { title, author, isbn, price, description }) {
  return http.put(`/books/${id}`, { id, title, author, isbn, price, description })
}

export function deleteBook(id) {
  return http.delete(`/books/${id}`)
}
