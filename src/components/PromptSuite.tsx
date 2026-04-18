import { useState, KeyboardEvent } from 'react';
import { processPrompt, MAX_INPUT_CHARACTERS } from '../services/ai';
import {
  Loader2,
  Terminal,
  Wand2,
  Settings2,
  Edit3,
  ListChecks,
  CircleAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CopyButton } from './CopyButton';
import { PaneLayout, OptionsStyle } from '../services/settings';
import { CharCount } from './CharCount';
import { OptionsControl } from './ui/OptionsControl';

type Mode = 'make' | 'optimize' | 'rewrite';

const MODES: {
  id: Mode;
  label: string;
  icon: any;
  desc: string;
  placeholder: string;
}[] = [
  {
    id: 'make',
    label: 'Prompt Maker',
    icon: Wand2,
    desc: 'Turn a rough idea into a detailed prompt',
    placeholder:
      'E.g., I want a prompt that helps me write a sci-fi story about a time-traveling detective...',
  },
  {
    id: 'optimize',
    label: 'Optimizer',
    icon: Settings2,
    desc: 'Improve an existing prompt',
    placeholder:
      'Paste your existing prompt here to make it more robust and clear...',
  },
  {
    id: 'rewrite',
    label: 'Rewrite',
    icon: Edit3,
    desc: 'Adapt a prompt for a new goal',
    placeholder: 'Paste the prompt you want to adapt...',
  },
];

interface PromptSuiteProps {
  layout: PaneLayout;
  optionsStyle: OptionsStyle;
}

export function PromptSuite({ layout, optionsStyle }: PromptSuiteProps) {
  const [mode, setMode] = useState<Mode>('make');
  const [text, setText] = useState('');
  const [extra, setExtra] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{
    resultPrompt: string;
    explanation?: string;
    improvements?: string[];
  } | null>(null);

  const activeModeData = MODES.find((m) => m.id === mode)!;
  const isOverLimit = text.length > MAX_INPUT_CHARACTERS;

  const handleProcess = async () => {
    if (!text.trim() || isOverLimit || (mode === 'rewrite' && !extra.trim()))
      return;
    setIsChecking(true);
    try {
      const res = await processPrompt(mode, text, extra);
      setResult(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleProcess();
    }
  };

  const gridClass =
    layout === 'side-by-side' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1';

  return (
    <div className='flex flex-col gap-8 flex-1'>
      <header>
        <h1 className='text-4xl font-light tracking-tight mb-2 dark:text-white'>
          Prompt Suite
        </h1>
        <p className='text-gray-500 dark:text-neutral-400'>
          Craft, optimize, and rewrite prompts for Large Language Models.
        </p>
      </header>

      {/* Mode Selector */}
      <div className='self-start'>
        <OptionsControl
          value={mode}
          options={MODES.map((m) => ({
            value: m.id,
            label: m.label,
            description: m.desc,
          }))}
          onChange={(v) => {
            setMode(v as Mode);
            setResult(null);
          }}
          style={optionsStyle}
          tabsClassName='w-max'
          dropdownClassName='w-[200px]'
        />
      </div>

      <div className={`grid items-start gap-6 flex-1 ${gridClass}`}>
        {/* Input Section */}
        <div className='bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden flex flex-col transition-colors duration-300 h-full'>
          <div className='p-4 border-b border-gray-50 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-800/30 flex justify-between items-center transition-colors'>
            <span className='text-sm font-medium text-gray-500 dark:text-neutral-400 font-sans'>
              Input
            </span>
          </div>

          <div className='flex-1 flex flex-col relative group min-h-[250px]'>
            <AnimatePresence>
              {isOverLimit && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className='absolute inset-x-0 top-0 z-10 bg-red-500/10 dark:bg-red-500/5 border-b border-red-200 dark:border-red-900/30 backdrop-blur-sm px-6 py-3 flex items-center justify-between pointer-events-none'
                >
                  <div className='flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-semibold'>
                    <CircleAlert
                      size={14}
                      className='animate-pulse'
                    />
                    <span>EXCEEDS CAPACITY LIMIT</span>
                  </div>
                  <span className='text-[10px] font-mono text-red-500/70 uppercase'>
                    {(text.length - MAX_INPUT_CHARACTERS).toLocaleString()}{' '}
                    chars overflowing
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeModeData.placeholder}
              className={`flex-1 p-6 ${isOverLimit ? 'pt-14' : ''} resize-none focus:outline-none font-sans text-base leading-relaxed text-gray-800 dark:text-neutral-200 placeholder:text-gray-300 dark:placeholder-neutral-600 bg-transparent transition-all duration-300 ${isOverLimit ? 'bg-red-50/10 dark:bg-red-950/5' : ''}`}
            />
          </div>

          {mode === 'rewrite' && (
            <div className='p-4 border-t border-gray-50 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-800/30'>
              <label className='block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2'>
                New Goal or Style
              </label>
              <input
                type='text'
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='E.g., Make it suitable for a coding assistant, or change the tone to professional...'
                className='w-full p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-sm transition-colors'
              />
            </div>
          )}

          <div className='p-4 border-t border-gray-50 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-800/30 flex flex-col-reverse 2xl:flex-row 2xl:justify-between items-start 2xl:items-center transition-colors'>
            <div className='flex items-center mt-6 2xl:mt-0 gap-4'>
              <CharCount count={text.length} />
              <span className='text-[10px] uppercase font-bold tracking-widest text-gray-400 dark:text-neutral-500'>
                {text.split(/\s+/).filter((w) => w.length > 0).length} words
              </span>
            </div>
            <button
              onClick={handleProcess}
              disabled={
                isChecking ||
                !text.trim() ||
                isOverLimit ||
                (mode === 'rewrite' && !extra.trim())
              }
              className={`px-6 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 transition-all ${isOverLimit ? 'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-600' : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isChecking ? (
                <Loader2
                  className='animate-spin'
                  size={16}
                />
              ) : (
                <Terminal size={16} />
              )}
              {isChecking ? 'Processing...' : 'Generate Prompt'}
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className='bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden flex flex-col min-h-[400px] max-h-[calc(100vh-12rem)] transition-colors duration-300 h-full'>
          <div className='p-4 border-b border-gray-50 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-800/30 flex justify-between items-center'>
            <span className='text-sm font-medium text-gray-500 dark:text-neutral-400'>
              Result
            </span>
            {result && <CopyButton text={result.resultPrompt} />}
          </div>

          <div className='p-6 flex-1 overflow-y-auto'>
            <AnimatePresence mode='wait'>
              {isChecking ? (
                <motion.div
                  key='loading'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className='h-full flex flex-col items-center justify-center text-gray-400 dark:text-neutral-500 gap-4'
                >
                  <Loader2
                    className='animate-spin'
                    size={32}
                  />
                  <p className='text-sm'>Engineering prompt...</p>
                </motion.div>
              ) : result ? (
                <motion.div
                  key='result'
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='flex flex-col gap-8'
                >
                  <div className='bg-gray-900 dark:bg-black text-gray-100 dark:text-neutral-300 p-5 rounded-2xl font-mono text-sm leading-relaxed whitespace-pre-wrap border border-transparent dark:border-neutral-800'>
                    {result.resultPrompt}
                  </div>

                  {result.explanation && (
                    <div className='pt-2'>
                      <div className='flex items-center gap-2 mb-2 text-gray-900 dark:text-neutral-100 font-semibold uppercase tracking-wider text-sm'>
                        <Wand2 size={16} />
                        Explanation
                      </div>
                      <p className='text-gray-600 dark:text-neutral-400 leading-relaxed text-sm'>
                        {result.explanation}
                      </p>
                    </div>
                  )}

                  {result.improvements && result.improvements.length > 0 && (
                    <div className='pt-2'>
                      <div className='flex items-center gap-2 mb-3 text-gray-900 dark:text-neutral-100 font-semibold uppercase tracking-wider text-sm'>
                        <ListChecks size={16} />
                        Improvements Made
                      </div>
                      <ul className='space-y-2'>
                        {result.improvements.map((imp, idx) => (
                          <li
                            key={idx}
                            className='flex items-start gap-3 text-gray-600 dark:text-neutral-400 text-sm'
                          >
                            <span className='w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 mt-2 shrink-0' />
                            <span className='leading-relaxed'>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key='empty'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='h-full flex flex-col items-center justify-center text-gray-400 dark:text-neutral-500 gap-4'
                >
                  <div className='w-16 h-16 rounded-full bg-gray-50 dark:bg-neutral-800/50 flex items-center justify-center'>
                    <Terminal
                      size={24}
                      className='text-gray-300 dark:text-neutral-600'
                    />
                  </div>
                  <p className='text-sm text-center max-w-[250px]'>
                    {activeModeData.desc}. Your engineered prompt will appear
                    here.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
