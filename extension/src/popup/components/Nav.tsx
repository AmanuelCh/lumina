import {
  CheckCircle2, RefreshCw, AlignLeft, Gauge,
  Bot, Globe, BookOpen, Zap, Settings,
} from 'lucide-react'
import type { PopupTab } from '../App'

const TABS: Array<{ id: PopupTab; icon: React.ReactNode; label: string }> = [
  { id: 'grammar',    icon: <CheckCircle2 size={15} />, label: 'Grammar'    },
  { id: 'paraphrase', icon: <RefreshCw    size={15} />, label: 'Rephrase'   },
  { id: 'summarize',  icon: <AlignLeft    size={15} />, label: 'Summarize'  },
  { id: 'tone',       icon: <Gauge        size={15} />, label: 'Tone'       },
  { id: 'humanize',   icon: <Bot          size={15} />, label: 'Humanize'   },
  { id: 'translate',  icon: <Globe        size={15} />, label: 'Translate'  },
  { id: 'dictionary', icon: <BookOpen     size={15} />, label: 'Dictionary' },
  { id: 'prompt',     icon: <Zap          size={15} />, label: 'Prompts'    },
  { id: 'settings',   icon: <Settings     size={15} />, label: 'Settings'   },
]

interface Props {
  tab: PopupTab
  onSelect: (t: PopupTab) => void
}

export function Nav({ tab, onSelect }: Props) {
  return (
    <header className="flex-shrink-0 border-b border-neutral-200 dark:border-neutral-800 bg-[#fdfdfd] dark:bg-neutral-950">
      <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-800/60">
        <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">✦ Lumina</span>
      </div>
      <nav className="flex overflow-x-auto gap-0.5 px-2 py-1.5 scrollbar-none">
        {TABS.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-colors flex-shrink-0
              ${tab === id
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-black'
                : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </nav>
    </header>
  )
}
