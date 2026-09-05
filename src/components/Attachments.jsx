import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { getErrorMessage } from '../utils/errors'
import EmptyState from './EmptyState'
import { Paperclip, Upload, Download, Trash2, FileText, Image as ImageIcon, X } from 'lucide-react'

// Backend's allowed types (middleware/upload.js) — kept in sync so we can
// reject obviously-bad files client-side before hitting the network, and so
// the native file picker only shows relevant files.
const ACCEPT = '.jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx'
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB — must match backend limit

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function Attachments({ customerId }) {
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const fileInputRef = useRef(null)

  const fetchAttachments = useCallback(async () => {
    if (!customerId) return
    setLoading(true)
    try {
      const res = await api.get(`/attachments/${customerId}`)
      setAttachments(res.data)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load attachments'))
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => { fetchAttachments() }, [fetchAttachments])

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    // Let the user pick the same file again later (e.g. after a failed
    // upload) — without this, selecting the same filename twice in a row
    // doesn't fire onChange.
    e.target.value = ''
    if (!file) return

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('File is too large — max 10MB')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    try {
      const res = await api.post(`/attachments/${customerId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setAttachments((prev) => [res.data, ...prev])
      toast.success('File uploaded')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Upload failed'))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await api.delete(`/attachments/${id}`)
      setAttachments((prev) => prev.filter((a) => a._id !== id))
      toast.success('Attachment deleted')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete attachment'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide inline-flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5" /> Attachments
          {attachments.length > 0 && <span className="font-mono normal-case">({attachments.length})</span>}
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !customerId}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink-950 dark:bg-brand-500 hover:bg-ink-800 dark:hover:bg-brand-600 text-white dark:text-ink-950 text-xs font-medium rounded-lg transition disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" /> {uploading ? 'Uploading...' : 'Upload'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-slate-50 dark:bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : attachments.length === 0 ? (
        <EmptyState icon={Paperclip} title="No attachments yet" message="Upload files related to this customer." className="py-8" />
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
          {attachments.map((a) => {
            const isImage = a.resourceType === 'image'
            return (
              <div
                key={a._id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5"
              >
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-ink-700 flex items-center justify-center shrink-0">
                  {isImage ? (
                    <ImageIcon className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                  ) : (
                    <FileText className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink-950 dark:text-white truncate">{a.fileName}</p>
                  <p className="text-xs text-slate-400">
                    {formatBytes(a.fileSize)}
                    {a.uploadedBy?.name && ` · ${a.uploadedBy.name}`}
                  </p>
                </div>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-white dark:hover:bg-ink-700 transition"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(a._id)}
                  disabled={deletingId === a._id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-ink-700 transition disabled:opacity-50"
                  title="Delete"
                >
                  {deletingId === a._id ? <X className="w-4 h-4 animate-pulse" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Attachments