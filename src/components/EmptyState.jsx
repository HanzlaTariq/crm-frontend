// Generic empty state — icon + title + message, with an optional action
// button. Used anywhere a list/table can legitimately be empty (no
// customers, no follow-ups, no notifications, no search results, ...).
function EmptyState({ icon: Icon, title, message, actionLabel, onAction, className = '' }) {
  return (
    <div className={`text-center py-14 px-6 ${className}`}>
      {Icon && (
        <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center">
          <Icon className="w-6 h-6 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
        </div>
      )}
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</p>
      {message && <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">{message}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ink-950 dark:bg-brand-500 hover:bg-ink-800 dark:hover:bg-brand-600 text-white dark:text-ink-950 text-sm font-medium transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState
