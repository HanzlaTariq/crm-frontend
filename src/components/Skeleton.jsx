// Reusable skeleton primitives — replace bare "Loading..." text / blank
// screens across the app with a shape that hints at the content underneath.

export function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse bg-slate-100 dark:bg-white/5 rounded-lg ${className}`} />
}

export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className="h-3 rounded-md bg-slate-100 dark:bg-white/5 animate-pulse"
          style={{ width: i === lines - 1 && lines > 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white dark:bg-ink-800 rounded-xl p-5 border border-slate-100 dark:border-white/5 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/5 animate-pulse" />
        <div className="w-16 h-3 rounded bg-slate-100 dark:bg-white/5 animate-pulse" />
      </div>
      <div className="mt-4 w-20 h-8 rounded-md bg-slate-100 dark:bg-white/5 animate-pulse" />
      <div className="mt-2 w-28 h-3 rounded bg-slate-100 dark:bg-white/5 animate-pulse" />
    </div>
  )
}

// Table skeleton — desktop rows with column-shaped bars so the layout doesn't
// jump once real data lands.
export function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <table className="w-full text-sm">
      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
        {[...Array(rows)].map((_, r) => (
          <tr key={r}>
            {[...Array(cols)].map((_, c) => (
              <td key={c} className="px-6 py-4">
                <div
                  className="h-3.5 rounded-md bg-slate-100 dark:bg-white/5 animate-pulse"
                  style={{ width: c === 0 ? '80%' : `${50 + ((r + c) % 3) * 15}%` }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Mobile card-list skeleton — mirrors the stacked card layout used for
// small-screen tables.
export function SkeletonCardList({ count = 4 }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-ink-800 rounded-xl p-4 border border-slate-100 dark:border-white/5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3.5 w-2/3 rounded bg-slate-100 dark:bg-white/5 animate-pulse" />
              <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-white/5 animate-pulse" />
            </div>
            <div className="h-5 w-16 rounded-full bg-slate-100 dark:bg-white/5 animate-pulse shrink-0" />
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex gap-4">
            <div className="h-3 w-10 rounded bg-slate-100 dark:bg-white/5 animate-pulse" />
            <div className="h-3 w-10 rounded bg-slate-100 dark:bg-white/5 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
