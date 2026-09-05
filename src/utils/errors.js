// Backend's centralized error handler always responds with
// { success: false, message: string, errors?: [{ field, message }] }
// This pulls a single human-readable string out of that shape (or an axios/
// network failure) so every page can show the same toast/inline message
// without repeating the fallback chain everywhere.
export function getErrorMessage(err, fallback = 'Something went wrong') {
  const data = err?.response?.data
  if (data?.errors?.length) {
    // Validation errors — show the first field-level message, it's usually
    // the most actionable one for the user.
    return data.errors[0].message || data.message || fallback
  }
  if (data?.message) return data.message
  if (err?.message === 'Network Error') return 'Network error — check your connection'
  if (err?.code === 'ECONNABORTED') return 'Request timed out — please try again'
  return fallback
}

// Pulls pagination metadata off the response headers the backend rides
// alongside the plain-array body (X-Total-Count, X-Total-Pages, X-Page, X-Limit).
export function getPaginationMeta(res) {
  const h = res.headers || {}
  return {
    totalCount: Number(h['x-total-count'] ?? 0),
    totalPages: Number(h['x-total-pages'] ?? 1),
    page: Number(h['x-page'] ?? 1),
    limit: Number(h['x-limit'] ?? 20),
  }
}
