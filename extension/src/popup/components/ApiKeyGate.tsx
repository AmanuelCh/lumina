import { useState } from 'react'
import { Loader2, ExternalLink } from 'lucide-react'
import { verifyApiKey } from '../../services/gemini'

interface Props {
  onSave: (key: string) => void
}

export function ApiKeyGate({ onSave }: Props) {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!key.trim()) return
    setLoading(true)
    setError(null)
    const { valid, error: err } = await verifyApiKey(key.trim())
    setLoading(false)
    if (valid) {
      onSave(key.trim())
    } else {
      setError(err ?? 'Verification failed.')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 bg-[#fdfdfd] dark:bg-neutral-950">
      <div className="text-2xl mb-1 font-bold tracking-tight dark:text-white">✦ Lumina</div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 text-center">
        Enter your Google Gemini API key to get started.
      </p>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="AIza..."
          autoFocus
          className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
        />

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !key.trim()}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? 'Verifying…' : 'Continue'}
        </button>
      </form>

      <a
        href="https://aistudio.google.com/app/apikey"
        target="_blank"
        rel="noreferrer"
        className="mt-4 flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
      >
        Get a free API key <ExternalLink size={10} />
      </a>
    </div>
  )
}
