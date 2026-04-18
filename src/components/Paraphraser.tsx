import { useState, KeyboardEvent } from 'react';
import { paraphraseText, expandText, MAX_INPUT_CHARACTERS } from '../services/ai';
import {
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  CircleAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CopyButton } from './CopyButton';
import { PaneLayout, OptionsStyle } from '../services/settings';
import { CharCount } from './CharCount';
import { OptionsControl } from './ui/OptionsControl';

const STYLES = [
  {
    value: 'fluent',
    label: 'Fluent',
    description: 'Improves flow and readability',
  },
  {
    value: 'formal',
    label: 'Formal',
    description: 'Professional and sophisticated',
  },
  {
    value: 'informal',
    label: 'Informal',
    description: 'Casual and conversational',
  },
  {
    value: 'playful',
    label: 'Playful',
    description: 'Fun, engaging, and creative',
  },
  {
    value: 'academic',
    label: 'Academic',
    description: 'Scholarly and objective',
  },
  {
    value: 'shorten',
    label: 'Shorten',
    description: 'Makes text concise and brief',
  },
  {
    value: 'expand',
    label: 'Expand',
    description: 'Elaborates and adds depth',
  },
  {
    value: 'slang',
    label: 'Slang',
    description: 'Modern internet/street slang',
  },
];

interface ParaphraserProps {
  layout: PaneLayout;
  optionsStyle: OptionsStyle;
}

export function Paraphraser({ layout, optionsStyle }: ParaphraserProps) {
  const [text, setText] = useState('');
  const [style, setStyle] = useState('fluent');
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    paraphrasedText: string;
    explanation: string;
  } | null>(null);

  const isOverLimit = text.length > MAX_INPUT_CHARACTERS;

  const handleParaphrase = async () => {
    if (!text.trim() || isOverLimit) return;
    setIsChecking(true);
    setError(null);
    try {
      if (style === 'expand') {
        const res = await expandText(text);
        setResult({
          paraphrasedText: res.expandedText,
          explanation: res.explanation,
        });
      } else {
        const res = await paraphraseText(text, style);
        setResult(res);
      }
    } catch (err: any) {
      setError(
        err?.message || 'An unexpected error occurred. Please try again.',
      );
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleParaphrase();
    }
  };

  const gridClass =
    layout === 'side-by-side' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1';

  return (
    <div className='flex flex-col gap-8 flex-1'>
      <header>
        <h1 className='text-4xl font-light tracking-tight mb-2 dark:text-white'>
          Paraphraser
        </h1>
        <p className='text-gray-500 dark:text-neutral-400'>
          Rewrite your text in different styles while preserving the original
          meaning.
        </p>
      </header>

      <div className='flex items-center gap-4'>
        <OptionsControl
          value={style}
          options={STYLES}
          onChange={setStyle}
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
              Original Text
            </span>
          </div>
          <div className='relative flex-1 flex flex-col group min-h-[300px]'>
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
              placeholder='Paste text to paraphrase...'
              className={`flex-1 p-6 ${isOverLimit ? 'pt-14' : ''} resize-none focus:outline-none font-serif text-lg leading-relaxed text-gray-800 dark:text-neutral-200 placeholder:text-gray-300 dark:placeholder-neutral-600 bg-transparent transition-all duration-300 ${isOverLimit ? 'bg-red-50/10 dark:bg-red-950/5' : ''}`}
            />
          </div>
          <div className='p-4 border-t border-gray-50 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-800/30 flex flex-col-reverse 2xl:flex-row 2xl:justify-between items-start 2xl:items-center transition-colors'>
            <div className='flex items-center mt-6 2xl:mt-0 gap-4'>
              <CharCount count={text.length} />
              <span className='text-[10px] uppercase font-bold tracking-widest text-gray-400 dark:text-neutral-500 '>
                {text.split(/\s+/).filter((w) => w.length > 0).length} words
              </span>
            </div>
            <button
              onClick={handleParaphrase}
              disabled={isChecking || !text.trim() || isOverLimit}
              className={`px-6 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 transition-all ${isOverLimit ? 'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-600' : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isChecking ? (
                <Loader2
                  className='animate-spin'
                  size={16}
                />
              ) : (
                <RefreshCw size={16} />
              )}
              {isChecking ? 'Rewriting...' : 'Paraphrase'}
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className='bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden flex flex-col min-h-[400px] max-h-[calc(100vh-12rem)] transition-colors duration-300 h-full'>
          <div className='p-4 border-b border-gray-50 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-800/30 flex justify-between items-center'>
            <div className='flex items-center gap-3'>
              <span className='text-sm font-medium text-gray-500 dark:text-neutral-400'>
                Paraphrased Text
              </span>
              {result && (
                <span className='text-xs text-gray-400 dark:text-neutral-500 bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded-md'>
                  {STYLES.find((s) => s.value === style)?.label} Style
                </span>
              )}
            </div>
            {result && <CopyButton text={result.paraphrasedText} />}
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
                  <p className='text-sm'>Applying {style} style...</p>
                </motion.div>
              ) : error ? (
                <motion.div
                  key='error'
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className='h-full flex flex-col items-center justify-center text-center p-6 gap-4'
                >
                  <div className='w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500'>
                    <RefreshCw
                      size={24}
                      className='animate-pulse'
                    />
                  </div>
                  <div>
                    <h3 className='text-sm font-semibold text-gray-900 dark:text-neutral-100 mb-1'>
                      Paraphrase Failed
                    </h3>
                    <p className='text-xs text-gray-500 dark:text-neutral-400 max-w-[200px] leading-relaxed'>
                      {error}
                    </p>
                  </div>
                  <button
                    onClick={handleParaphrase}
                    className='text-xs font-semibold text-red-600 dark:text-red-400 hover:underline'
                  >
                    Try again
                  </button>
                </motion.div>
              ) : result ? (
                <motion.div
                  key='result'
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='flex flex-col gap-8'
                >
                  <div className='font-serif text-lg leading-relaxed text-gray-800 dark:text-neutral-200'>
                    {result.paraphrasedText}
                  </div>

                  {result.explanation && (
                    <div className='pt-6 border-t border-gray-100 dark:border-neutral-800'>
                      <div className='bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl p-4 text-sm'>
                        <div className='flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-400 font-medium'>
                          <SlidersHorizontal size={16} />
                          Style Notes
                        </div>
                        <p className='text-gray-600 dark:text-neutral-400 leading-relaxed'>
                          {result.explanation}
                        </p>
                      </div>
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
                    <RefreshCw
                      size={24}
                      className='text-gray-300 dark:text-neutral-600'
                    />
                  </div>
                  <p className='text-sm'>
                    Your paraphrased text will appear here.
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
