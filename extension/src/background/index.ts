const MENU_ITEMS = [
  { id: 'grammar',    title: 'Check Grammar'           },
  { id: 'paraphrase', title: 'Paraphrase'               },
  { id: 'summarize',  title: 'Summarize'                },
  { id: 'translate',  title: 'Translate'                },
  { id: 'humanize',   title: 'Humanize (AI Detection)'  },
]

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'lumina-root',
    title: '✦ Lumina',
    contexts: ['selection'],
  })

  for (const item of MENU_ITEMS) {
    chrome.contextMenus.create({
      id: `lumina-${item.id}`,
      parentId: 'lumina-root',
      title: item.title,
      contexts: ['selection'],
    })
  }
})

// Store the pending tool in local storage so the popup can read it on open.
// Uses storage.local (not storage.session) for full Firefox compatibility.
chrome.contextMenus.onClicked.addListener((info, _tab) => {
  if (!info.menuItemId) return
  const id = String(info.menuItemId)
  if (!id.startsWith('lumina-') || id === 'lumina-root') return

  const tool = id.replace('lumina-', '')
  chrome.storage.local.set({
    _pendingTool: tool,
    _pendingText: info.selectionText ?? '',
  })
})
