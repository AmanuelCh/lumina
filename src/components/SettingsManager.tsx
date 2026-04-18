import { useState } from 'react';
import { verifyApiKey } from '../services/ai';
import {
  AppSettings,
  saveSettings,
  AppTab,
  Theme,
  PaneLayout,
  GeminiModel,
  OptionsStyle,
} from '../services/settings';

import {
  Settings as SettingsIcon,
  Columns2,
  Rows2,
  Moon,
  Sun,
  Monitor,
  CheckCircle2,
  ListFilter,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  AlertCircle,
  Trash2,
} from 'lucide-react';

import { motion } from 'motion/react';
import { Selector } from './ui/Selector';
import { Checkbox } from './ui/Checkbox';


interface SettingsProps {
  settings: AppSettings;
  onUpdate: (settings: Partial<AppSettings>) => void;
}

export function SettingsManager({ settings, onUpdate }: SettingsProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [draftKey, setDraftKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const handleUpdate = (update: Partial<AppSettings>) => {
    onUpdate(update);
    saveSettings(update);
  };

  return (
    <div className='flex flex-col gap-12 max-w-2xl'>
      <header>
        <h1 className='text-4xl font-light tracking-tight mb-2 dark:text-white'>
          Settings
        </h1>
        <p className='text-gray-500 dark:text-neutral-400'>
          Personalize your Lumina experience.
        </p>
      </header>

      <section className='flex flex-col gap-8'>
        {/* Appearance Section */}
        <div className='flex flex-col gap-4'>
          <h2 className='text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500'>
            Appearance
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Same as above but for theme and layout */}
            <div className='bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 flex flex-col gap-4 transition-colors'>
              <div className='flex items-center gap-3 font-medium dark:text-white'>
                <Sun
                  size={18}
                  className='text-gray-400'
                />
                Theme
              </div>
              <div className='flex p-1 bg-gray-50 dark:bg-neutral-800 rounded-xl gap-1'>
                {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleUpdate({ theme: t })}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg capitalize transition-all ${
                      settings.theme === t
                        ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className='bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 flex flex-col gap-4 transition-colors'>
              <div className='flex items-center gap-3 font-medium dark:text-white'>
                <Columns2
                  size={18}
                  className='text-gray-400'
                />
                Pane Layout
              </div>
              <div className='flex p-1 bg-gray-50 dark:bg-neutral-800 rounded-xl gap-1'>
                {(['side-by-side', 'stacked'] as PaneLayout[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => handleUpdate({ layout: l })}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                      settings.layout === l
                        ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                    }`}
                  >
                    {l === 'side-by-side' ? 'Standard' : 'Stacked'}
                  </button>
                ))}
              </div>
            </div>

            <div className='bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 flex flex-col gap-4 transition-colors md:col-span-2'>
              <div className='flex items-center gap-3 font-medium dark:text-white'>
                <ListFilter
                  size={18}
                  className='text-gray-400'
                />
                Control Interface
              </div>
              <p className='text-[10px] text-gray-500 dark:text-neutral-400 -mt-2'>
                Choose how tool-specific options are displayed.
              </p>
              <div className='flex p-1 bg-gray-50 dark:bg-neutral-800 rounded-xl gap-1'>
                {(['tabs', 'dropdown'] as OptionsStyle[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleUpdate({ optionsStyle: s })}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg capitalize transition-all ${
                      settings.optionsStyle === s
                        ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Defaults Section */}
        <div className='flex flex-col gap-4'>
          <h2 className='text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500'>
            Defaults & Tools
          </h2>

          <div className='bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 flex flex-col gap-6 transition-colors'>
            <div className='flex flex-col lg:flex-row lg:items-center items-start lg:justify-between'>
              <div className='flex flex-col mb-6 lg:0'>
                <span className='font-medium dark:text-white text-sm'>
                  Default Startup Tab
                </span>
                <span className='text-xs text-gray-500 dark:text-neutral-400'>
                  Which tool opens by default when you load Lumina.
                </span>
              </div>
              <Selector
                value={settings.defaultTab}
                onChange={(val) => handleUpdate({ defaultTab: val as AppTab })}
                options={[
                  { value: 'grammar', label: 'Grammar Check' },
                  { value: 'paraphrase', label: 'Paraphraser' },
                  { value: 'summarize', label: 'Summarizer' },
                  { value: 'tone', label: 'Tone Analyzer' },
                  { value: 'humanizer', label: 'Humanizer' },
                  { value: 'prompt', label: 'Prompt Suite' },
                  { value: 'settings', label: 'Settings' },
                ]}
                className="w-48"
              />

            </div>

            <div className='h-px bg-gray-50 dark:bg-neutral-800' />

              <div className="flex flex-col">
                <Checkbox
                  checked={settings.preserveInformality}
                  onChange={(checked) => handleUpdate({ preserveInformality: checked })}
                  label="Always Keep Informal"
                  description="Grammar checker will default to preserving your casual voice."
                />
              </div>

          </div>
        </div>

        {/* API Key Section */}
        <div className='flex flex-col gap-4'>
          <h2 className='text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500'>
            API Key
          </h2>
          <div className='bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 flex flex-col gap-4 transition-colors'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3 font-medium dark:text-white'>
                <Key size={18} className='text-gray-400' />
                Gemini API Key
              </div>
              {settings.apiKey.trim() && !isEditingKey && (
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => {
                      setDraftKey(settings.apiKey);
                      setIsEditingKey(true);
                      setKeyError(null);
                    }}
                    className='text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors'
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleUpdate({ apiKey: '' })}
                    className='text-gray-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 transition-colors'
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Current key display (when not editing) */}
            {settings.apiKey.trim() && !isEditingKey && (
              <>
                <div className='flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-neutral-800 rounded-xl'>
                  <span className='flex-1 text-sm font-mono text-gray-500 dark:text-neutral-400 truncate'>
                    {showApiKey
                      ? settings.apiKey
                      : settings.apiKey.trim() === 'ADMINTEST'
                        ? '••••••••••'
                        : settings.apiKey.slice(0, 8) + '••••••••••••'}
                  </span>
                  <button
                    type='button'
                    onClick={() => setShowApiKey(!showApiKey)}
                    className='text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors shrink-0'
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg ${
                  settings.apiKey.trim() === 'ADMINTEST'
                    ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400'
                    : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <CheckCircle2 size={14} />
                  {settings.apiKey.trim() === 'ADMINTEST'
                    ? 'Using Lumina promo access'
                    : 'Using your personal API key'}
                </div>
              </>
            )}

            {/* Edit / new key input */}
            {(isEditingKey || !settings.apiKey.trim()) && (
              <>
                <div className='relative'>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={draftKey}
                    onChange={(e) => {
                      setDraftKey(e.target.value);
                      setKeyError(null);
                    }}
                    placeholder='AIzaSy... or promo code'
                    disabled={isVerifying}
                    className='w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-neutral-800 rounded-xl text-sm font-mono text-gray-800 dark:text-neutral-200 placeholder:text-gray-300 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:focus:ring-violet-400/20 border border-transparent focus:border-violet-300 dark:focus:border-violet-700 transition-all disabled:opacity-50'
                  />
                  <button
                    type='button'
                    onClick={() => setShowApiKey(!showApiKey)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors'
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {keyError && (
                  <div className='flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2.5 rounded-lg'>
                    <AlertCircle size={14} className='shrink-0' />
                    {keyError}
                  </div>
                )}

                <div className='flex items-center gap-3'>
                  <button
                    onClick={async () => {
                      if (!draftKey.trim() || isVerifying) return;
                      setIsVerifying(true);
                      setKeyError(null);
                      const result = await verifyApiKey(draftKey);
                      setIsVerifying(false);
                      if (result.valid) {
                        handleUpdate({ apiKey: draftKey.trim() });
                        setIsEditingKey(false);
                        setDraftKey('');
                      } else {
                        setKeyError(result.error || 'Verification failed.');
                      }
                    }}
                    disabled={!draftKey.trim() || isVerifying}
                    className='px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed'
                  >
                    {isVerifying ? (
                      <><Loader2 size={14} className='animate-spin' /> Verifying...</>
                    ) : (
                      'Verify & Save'
                    )}
                  </button>
                  {isEditingKey && (
                    <button
                      onClick={() => {
                        setIsEditingKey(false);
                        setDraftKey('');
                        setKeyError(null);
                      }}
                      className='px-4 py-2 rounded-xl text-xs font-medium text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200 transition-colors'
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </>
            )}

            <a
              href='https://aistudio.google.com/apikey'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors w-max'
            >
              Get a free key from Google AI Studio
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Gemini Models Section */}
        <div className='flex flex-col gap-4'>
          <h2 className='text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500'>
            Gemini Intelligence
          </h2>
          <div className='bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 flex flex-col gap-6 transition-colors'>
            <div className='flex flex-col lg:flex-row items-start lg:items-center lg:justify-between'>
              <div className='flex flex-col mb-6 lg:mb-0'>
                <span className='font-medium dark:text-white text-sm'>
                  Standard Model (Flash)
                </span>
                <span className='text-xs text-gray-500 dark:text-neutral-400'>
                  Used for quick tasks like grammar and tone checks.
                </span>
              </div>
              <Selector
                value={settings.model}
                onChange={(val) => handleUpdate({ model: val as GeminiModel })}
                options={[
                  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash', description: '2026 Preview' },
                  { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', description: '2026 Preview' },
                  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
                  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
                ]}
                className="w-64"
              />

            </div>

            <div className='h-px bg-gray-50 dark:bg-neutral-800' />

            <div className='flex flex-col lg:flex-row items-start lg:items-center lg:justify-between'>
              <div className='flex flex-col mb-6 lg:0'>
                <span className='font-medium dark:text-white text-sm'>
                  Reasoning Model (Pro)
                </span>
                <span className='text-xs text-gray-500 dark:text-neutral-400'>
                  Used for heavy tasks like AI Humanization and Forensics.
                </span>
              </div>
              <Selector
                value={settings.proModel}
                onChange={(val) => handleUpdate({ proModel: val as GeminiModel })}
                options={[
                  { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', description: 'Flagship' },
                  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
                  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
                  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
                ]}
                className="w-64"
              />

            </div>
          </div>
        </div>
        {/* Shortcuts Section */}
        <div className='flex flex-col gap-4'>
          <h2 className='text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500'>
            Keyboard Shortcuts
          </h2>
          <div className='bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 divide-y divide-gray-50 dark:divide-neutral-800 transition-colors overflow-hidden'>
            {[
              { label: 'Toggle Sidebar', key: 'Mod + B' },
              { label: 'Toggle Layout', key: 'Mod + L' },
              { label: 'Toggle Theme', key: 'Mod + Shift + L' },
              { label: 'Settings', key: 'Mod + ,' },
            ].map((s) => (
              <div
                key={s.label}
                className='p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 transition-colors'
              >
                <span className='text-sm text-gray-600 dark:text-neutral-300'>
                  {s.label}
                </span>
                <div className='flex gap-1'>
                  {s.key.split(' + ').map((k) => (
                    <kbd
                      key={k}
                      className='px-2 py-1 bg-gray-100 dark:bg-neutral-800 text-[10px] font-mono font-bold rounded-md border border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-neutral-400 shadow-sm min-w-[24px] text-center'
                    >
                      {k === 'Mod'
                        ? navigator.platform.includes('Mac')
                          ? '⌘'
                          : 'Ctrl'
                        : k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className='mt-8 p-6 bg-gray-50 dark:bg-neutral-800/30 rounded-3xl flex items-center gap-4 border border-gray-100 dark:border-neutral-800'>
        <div className='w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-400'>
          <CheckCircle2 size={20} />
        </div>
        <div className='flex flex-col'>
          <span className='text-xs font-semibold dark:text-white'>
            Settings Auto-Saved
          </span>
          <span className='text-xs text-gray-400'>
            Your preferences are stored locally in your browser.
          </span>
        </div>
      </footer>
    </div>
  );
}
