import { checkGrammar, paraphraseText, summarizeText, translateText } from '../services/gemini'
import { getSettings } from '../services/storage'

// ── Toolbar state ────────────────────────────────────────────────────────────

let host: HTMLDivElement | null = null
let shadow: ShadowRoot | null = null
let savedText = ''
let savedRange: Range | null = null
let savedInputEl: HTMLInputElement | HTMLTextAreaElement | null = null
let savedSelStart = 0
let savedSelEnd = 0

// ── Styles (injected into Shadow DOM) ────────────────────────────────────────

const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.wrap {
  position: fixed;
  z-index: 2147483647;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 13px;
  line-height: 1.4;
}

.trigger {
  pointer-events: all;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0,0,0,.25);
  transition: transform .1s, box-shadow .1s;
  white-space: nowrap;
  letter-spacing: .01em;
}
.trigger:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,.3); }
.trigger .star { font-size: 11px; opacity: .9; }

.panel {
  pointer-events: all;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 8px 30px rgba(0,0,0,.14);
  min-width: 240px;
  max-width: 320px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 8px;
  border-bottom: 1px solid #f3f4f6;
  background: #fafafa;
}
.panel-title {
  font-size: 12px;
  font-weight: 700;
  color: #111;
  letter-spacing: .02em;
  display: flex;
  align-items: center;
  gap: 5px;
}
.panel-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  font-size: 16px;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 4px;
}
.panel-close:hover { color: #374151; background: #f3f4f6; }

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 10px;
}
.action-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  padding: 8px 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: background .1s, border-color .1s;
  width: 100%;
}
.action-btn:hover { background: #f3f4f6; border-color: #d1d5db; }
.action-btn:disabled { opacity: .5; cursor: not-allowed; }
.action-name { font-size: 12px; font-weight: 600; color: #111; }
.action-desc { font-size: 10px; color: #6b7280; }

.result-area {
  padding: 10px;
  border-top: 1px solid #f3f4f6;
}
.result-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 12px;
  padding: 4px 0;
}
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #e5e7eb;
  border-top-color: #111;
  border-radius: 50%;
  animation: spin .7s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }
.result-text {
  font-size: 12px;
  color: #111;
  line-height: 1.5;
  max-height: 140px;
  overflow-y: auto;
  padding: 4px 0;
  word-break: break-word;
}
.result-error {
  font-size: 12px;
  color: #dc2626;
  padding: 4px 0;
}
.result-btns {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}
.result-btn {
  flex: 1;
  padding: 5px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid;
  cursor: pointer;
  transition: background .1s;
}
.btn-copy {
  background: #f9fafb;
  border-color: #e5e7eb;
  color: #374151;
}
.btn-copy:hover { background: #f3f4f6; }
.btn-replace {
  background: #000;
  border-color: #000;
  color: #fff;
}
.btn-replace:hover { background: #1f2937; }
.btn-replace:disabled { opacity: .4; cursor: not-allowed; }
.copied-msg { font-size: 11px; color: #16a34a; font-weight: 600; margin-top: 4px; }
`

// ── DOM helpers ───────────────────────────────────────────────────────────────

function getOrCreateHost(): { host: HTMLDivElement; shadow: ShadowRoot } {
  const existing = document.getElementById('__lumina_toolbar__') as HTMLDivElement | null
  if (existing && existing.shadowRoot) return { host: existing, shadow: existing.shadowRoot }

  const h = document.createElement('div')
  h.id = '__lumina_toolbar__'
  h.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647;pointer-events:none;'
  document.documentElement.appendChild(h)
  const s = h.attachShadow({ mode: 'open' })
  const styleEl = document.createElement('style')
  styleEl.textContent = CSS
  s.appendChild(styleEl)
  return { host: h, shadow: s }
}

function getWrap(): HTMLElement {
  const { shadow: s } = getOrCreateHost()
  let wrap = s.querySelector<HTMLElement>('.wrap')
  if (!wrap) {
    wrap = document.createElement('div')
    wrap.className = 'wrap'
    s.appendChild(wrap)
  }
  return wrap
}

function hideToolbar() {
  const wrap = document.getElementById('__lumina_toolbar__')?.shadowRoot?.querySelector('.wrap')
  if (wrap) wrap.replaceChildren()
}

// Position a fixed element near the cursor, keeping it inside the viewport.
function positionNear(el: HTMLElement, cx: number, cy: number) {
  const margin = 10
  const vpW = window.innerWidth
  const vpH = window.innerHeight
  // Measure after appending (or use generous fallback before it's in the DOM)
  const w = el.offsetWidth  || (el.classList.contains('panel') ? 280 : 100)
  const h = el.offsetHeight || (el.classList.contains('panel') ? 220 :  32)

  let top  = cy + 18             // 18px below cursor
  let left = cx + 6              // 6px right of cursor

  if (left + w > vpW - margin) left = cx - w - 6   // flip left
  if (top  + h > vpH - margin) top  = cy - h - 10  // flip above
  if (left < margin) left = margin
  if (top  < margin) top  = margin

  el.style.position = 'fixed'
  el.style.top  = `${top}px`
  el.style.left = `${left}px`
}

// ── Selection capture ─────────────────────────────────────────────────────────

function captureSelection() {
  const sel = window.getSelection()
  const text = sel?.toString().trim() ?? ''
  if (!text || text.length < 3) return null

  if (sel && sel.rangeCount > 0) savedRange = sel.getRangeAt(0).cloneRange()

  const el = document.activeElement
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    savedInputEl = el
    savedSelStart = el.selectionStart ?? 0
    savedSelEnd = el.selectionEnd ?? 0
  } else {
    savedInputEl = null
  }

  return { text, range: savedRange! }
}

// ── Replace logic ─────────────────────────────────────────────────────────────

function canReplace(): boolean {
  return savedInputEl !== null
}

function replaceSelectedText(newText: string): boolean {
  if (!savedInputEl) return false
  const el = savedInputEl
  const val = el.value
  el.value = val.slice(0, savedSelStart) + newText + val.slice(savedSelEnd)
  el.setSelectionRange(savedSelStart, savedSelStart + newText.length)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  return true
}

// ── Toolbar rendering ─────────────────────────────────────────────────────────

function showTrigger(cx: number, cy: number, text: string) {
  const wrap = getWrap()
  wrap.replaceChildren()

  const btn = document.createElement('button')
  btn.className = 'trigger'
  const star = document.createElement('span')
  star.className = 'star'
  star.textContent = '✦'
  btn.appendChild(star)
  btn.appendChild(document.createTextNode(' Lumina'))
  // Position before appending so offsetWidth is still 0; positionNear uses fallback sizes.
  wrap.appendChild(btn)
  positionNear(btn, cx, cy)

  // Prevent mousedown from clearing the text selection.
  btn.addEventListener('mousedown', (e) => e.preventDefault())

  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    showPanel(cx, cy, text)
  })
}

type ToolState =
  | { kind: 'idle' }
  | { kind: 'loading'; label: string }
  | { kind: 'result'; text: string }
  | { kind: 'error'; message: string }

function showPanel(cx: number, cy: number, text: string) {
  const wrap = getWrap()
  wrap.replaceChildren()

  const panel = document.createElement('div')
  panel.className = 'panel'
  // Hide until positioned to avoid a top-left flash for one frame.
  panel.style.visibility = 'hidden'
  wrap.appendChild(panel)
  // rAF lets the browser measure the panel before we position it.
  requestAnimationFrame(() => {
    positionNear(panel, cx, cy)
    panel.style.visibility = 'visible'
  })

  // Prevent any click inside the panel from clearing the page text selection.
  panel.addEventListener('mousedown', (e) => e.preventDefault())

  // Header
  const header = document.createElement('div')
  header.className = 'panel-header'
  const panelTitle = document.createElement('span')
  panelTitle.className = 'panel-title'
  const titleStar = document.createElement('span')
  titleStar.textContent = '✦'
  panelTitle.appendChild(titleStar)
  panelTitle.appendChild(document.createTextNode(' Lumina'))
  header.appendChild(panelTitle)
  const closeBtn = document.createElement('button')
  closeBtn.className = 'panel-close'
  closeBtn.textContent = '×'
  closeBtn.title = 'Close'
  closeBtn.addEventListener('click', hideToolbar)
  header.appendChild(closeBtn)
  panel.appendChild(header)

  // Actions
  const actionsDiv = document.createElement('div')
  actionsDiv.className = 'actions'

  const tools = [
    { id: 'grammar', name: 'Grammar', desc: 'Fix errors' },
    { id: 'paraphrase', name: 'Paraphrase', desc: 'Fluent style' },
    { id: 'summarize', name: 'Summarize', desc: 'Short summary' },
    { id: 'translate', name: 'Translate', desc: 'Detect → English' },
  ]

  for (const tool of tools) {
    const btn = document.createElement('button')
    btn.className = 'action-btn'
    btn.dataset.tool = tool.id
    const nameSpan = document.createElement('span')
    nameSpan.className = 'action-name'
    nameSpan.textContent = tool.name
    const descSpan = document.createElement('span')
    descSpan.className = 'action-desc'
    descSpan.textContent = tool.desc
    btn.appendChild(nameSpan)
    btn.appendChild(descSpan)
    btn.addEventListener('click', () => runTool(tool.id, text, panel))
    actionsDiv.appendChild(btn)
  }
  panel.appendChild(actionsDiv)

  // Result area (empty initially)
  const resultArea = document.createElement('div')
  resultArea.className = 'result-area'
  resultArea.style.display = 'none'
  panel.appendChild(resultArea)

  function setAllButtons(disabled: boolean) {
    actionsDiv.querySelectorAll<HTMLButtonElement>('.action-btn').forEach((b) => {
      b.disabled = disabled
    })
  }

  async function runTool(toolId: string, inputText: string, _panel: HTMLElement) {
    setAllButtons(true)
    resultArea.style.display = 'block'
    renderState({ kind: 'loading', label: tools.find((t) => t.id === toolId)?.name ?? toolId })

    try {
      const { apiKey, model } = await getSettings()
      if (!apiKey) throw new Error('No API key configured. Open Lumina to set one.')

      let result = ''
      if (toolId === 'grammar') {
        const r = await checkGrammar(inputText, model, apiKey)
        result = r.correctedText
      } else if (toolId === 'paraphrase') {
        const r = await paraphraseText(inputText, 'fluent', model, apiKey)
        result = r.paraphrasedText
      } else if (toolId === 'summarize') {
        const r = await summarizeText(inputText, 'medium', model, apiKey)
        result = r.summary
      } else if (toolId === 'translate') {
        const r = await translateText(inputText, 'auto', 'English', model, apiKey)
        result = r.translatedText
      }

      renderState({ kind: 'result', text: result })
    } catch (err: any) {
      renderState({ kind: 'error', message: err?.message ?? 'An error occurred.' })
      setAllButtons(false)
    }
  }

  function renderState(state: ToolState) {
    resultArea.replaceChildren()
    if (state.kind === 'loading') {
      const row = document.createElement('div')
      row.className = 'result-loading'
      const spinner = document.createElement('div')
      spinner.className = 'spinner'
      const label = document.createElement('span')
      label.textContent = `Running ${state.label}…`
      row.appendChild(spinner)
      row.appendChild(label)
      resultArea.appendChild(row)
      return
    }
    if (state.kind === 'error') {
      const errEl = document.createElement('div')
      errEl.className = 'result-error'
      errEl.textContent = state.message
      resultArea.appendChild(errEl)
      return
    }
    if (state.kind === 'result') {
      const textEl = document.createElement('div')
      textEl.className = 'result-text'
      textEl.textContent = state.text

      const btns = document.createElement('div')
      btns.className = 'result-btns'

      const copyBtn = document.createElement('button')
      copyBtn.className = 'result-btn btn-copy'
      copyBtn.textContent = 'Copy'
      copyBtn.addEventListener('click', async () => {
        await navigator.clipboard.writeText(state.text).catch(() => {})
        const msg = document.createElement('div')
        msg.className = 'copied-msg'
        msg.textContent = 'Copied!'
        resultArea.appendChild(msg)
        setTimeout(() => msg.remove(), 1500)
      })

      const replaceBtn = document.createElement('button')
      replaceBtn.className = 'result-btn btn-replace'
      replaceBtn.textContent = 'Replace'
      replaceBtn.disabled = !canReplace()
      replaceBtn.title = canReplace() ? '' : 'Select text inside an input field to enable'
      replaceBtn.addEventListener('click', () => {
        if (replaceSelectedText(state.text)) hideToolbar()
      })

      btns.appendChild(copyBtn)
      btns.appendChild(replaceBtn)
      resultArea.appendChild(textEl)
      resultArea.appendChild(btns)
    }
  }
}

// ── Event listeners ───────────────────────────────────────────────────────────

let mouseUpTimeout: ReturnType<typeof setTimeout>

document.addEventListener('mouseup', (e) => {
  // In Shadow DOM, events from inside our toolbar are retargeted to the shadow
  // host at the document level. Skip any mouseup that originates inside the toolbar
  // so clicking trigger/action-buttons/close never re-triggers showTrigger().
  const toolbarHost = document.getElementById('__lumina_toolbar__')
  if (toolbarHost && e.target === toolbarHost) return

  const cursorX = e.clientX
  const cursorY = e.clientY

  clearTimeout(mouseUpTimeout)
  mouseUpTimeout = setTimeout(() => {
    const captured = captureSelection()
    if (!captured) {
      hideToolbar()
      return
    }
    savedText = captured.text
    showTrigger(cursorX, cursorY, savedText)
  }, 120)
})

document.addEventListener('keyup', (e) => {
  if (!e.shiftKey && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' &&
      e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'Home' && e.key !== 'End') return

  clearTimeout(mouseUpTimeout)
  mouseUpTimeout = setTimeout(() => {
    const captured = captureSelection()
    if (!captured) { hideToolbar(); return }
    savedText = captured.text
    // For keyboard selections position near the end of the selected range.
    const sel = window.getSelection()!
    if (!sel.rangeCount) return
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return
    showTrigger(rect.right, rect.bottom, savedText)
  }, 120)
})

// Close on outside click
document.addEventListener(
  'mousedown',
  (e) => {
    const h = document.getElementById('__lumina_toolbar__')
    if (h && !h.contains(e.target as Node)) hideToolbar()
  },
  true,
)

// Handle messages from popup (GET_SELECTION)
chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.type === 'GET_SELECTION') {
    reply({ text: window.getSelection()?.toString().trim() ?? '' })
    return true
  }
})
