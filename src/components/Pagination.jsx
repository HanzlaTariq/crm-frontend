import { ChevronLeft, ChevronRight } from 'lucide-react'

// Reads the same pagination shape returned by getPaginationMeta() —
// { page, totalPages, totalCount, limit } — and renders Prev/Next plus a
// "showing X-Y of Z" label. Keeps page-window logic simple (no numbered
// page buttons) since customer/user lists can run into hundreds of pages.
function Pagination({ page, totalPages, totalCount, limit, onPageChange, itemLabel = 'items' }) {
  if (totalCount === 0) return null

  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, totalCount)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-3 text-sm">
      <p className="text-slate-500 dark:text-slate-400">
        Showing <span className="font-medium text-ink-950 dark:text-white">{from}–{to}</span> of{' '}
        <span className="font-medium text-ink-950 dark:text-white">{totalCount}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-ink-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-ink-700 transition disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <span className="font-mono text-xs text-slate-400 px-1">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-ink-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-ink-700 transition disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default Pagination
