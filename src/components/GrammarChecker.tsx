import { useState, KeyboardEvent } from 'react';
import {
  checkGrammar,
  MAX_INPUT_CHARACTERS,
  GrammarOptions,
  DEFAULT_GRAMMAR_OPTIONS,
} from '../services/ai';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  CircleAlert,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CopyButton } from './CopyButton';
import { PaneLayout } from '../services/settings';
import { CharCount } from './CharCount';
import { Checkbox } from './ui/Checkbox';

interface GrammarCheckerProps {
  preserveInformalityDefault: boolean;
  layout: PaneLayout;
}

export function GrammarChecker({
  preserveInformalityDefault,
  layout,
}: GrammarCheckerProps) {
  const [text, setText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<GrammarOptions>({
    ...DEFAULT_GRAMMAR_OPTIONS,
    preserveInformality: preserveInformalityDefault,
  });
  const [result, setResult] = useState<{
    correctedText: string;
    explanations: {
      original: string;
      correction: string;
      explanation: string;
    }[];
  } | null>(null);

  const isOverLimit = text.length > MAX_INPUT_CHARACTERS;

  const activeExclusionCount = [
    options.skipCapitalization,
    options.skipPunctuation,
    options.skipSpelling,
    options.skipStyle,
    options.skipSentenceStructure,
  ].filter(Boolean).length;

  const updateOption = <K extends keyof GrammarOptions>(
    key: K,
    value: GrammarOptions[K],
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleCheck = async () => {
    if (!text.trim() || isOverLimit) return;
    setIsChecking(true);
    setError(null);
    try {
      const res = await checkGrammar(text, options);
      setResult(res);
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
      handleCheck();
    }
  };

  const gridClass =
    layout === 'side-by-side' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1';

  return (
    <div className='flex flex-col gap-8 flex-1'>
      <header>
        <h1 className='text-4xl font-light tracking-tight mb-2 dark:text-white'>
          Grammar Checker
        </h1>
        <p className='text-gray-500 dark:text-neutral-400'>
          Refine your writing with AI-powered grammar and style corrections.
        </p>
      </header>

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
              placeholder='Paste your text here to check for grammar, spelling, and style issues...'
              className={`flex-1 p-6 ${isOverLimit ? 'pt-14' : ''} resize-none focus:outline-none font-serif text-lg leading-relaxed text-gray-800 dark:text-neutral-200 placeholder:text-gray-300 dark:placeholder-neutral-600 bg-transparent transition-all duration-300 ${isOverLimit ? 'bg-red-50/10 dark:bg-red-950/5' : ''}`}
            />
          </div>
          <div className='p-4 border-t border-gray-50 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-800/30 transition-colors'>
            <div class='flex items-start flex-col sm:flex-row sm:justify-between sm:items-center gap-6'>
              <div className='flex items-center gap-3'>
                <Checkbox
                  checked={options.preserveInformality}
                  onChange={(v) => updateOption('preserveInformality', v)}
                  label='Keep it informal'
                  description='Preserve your tone'
                />
              </div>

              <button
                onClick={handleCheck}
                disabled={isChecking || !text.trim() || isOverLimit}
                className={`px-6 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 transition-all shrink-0 ${isOverLimit ? 'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-600' : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isChecking ? (
                  <Loader2
                    className='animate-spin'
                    size={16}
                  />
                ) : (
                  <Sparkles size={16} />
                )}
                {isChecking ? 'Analyzing...' : 'Check Grammar'}
              </button>
            </div>

            <div className='mt-6 pt-3 border-t border-gray-50 dark:border-neutral-800/50'>
              {/* Options toggle button */}
              <button
                onClick={() => setShowOptions(!showOptions)}
                className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                    ${
                      showOptions || activeExclusionCount > 0
                        ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 border border-gray-200 dark:border-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-700'
                    }
                  `}
              >
                <SlidersHorizontal size={12} />
                Options
                {activeExclusionCount > 0 && (
                  <span className='bg-violet-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center'>
                    {activeExclusionCount}
                  </span>
                )}
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${showOptions ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {/* Collapsible options panel */}
            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className='overflow-hidden'
                >
                  <div className='mt-4 pt-4 border-t border-gray-100 dark:border-neutral-800'>
                    <p className='text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-neutral-500 mb-3'>
                      Skip corrections for
                    </p>
                    <div className='grid grid-cols-1 xl:grid-cols-2 gap-3'>
                      <Checkbox
                        checked={options.skipCapitalization}
                        onChange={(v) => updateOption('skipCapitalization', v)}
                        label='Capitalization'
                        description='Keep original casing'
                      />
                      <Checkbox
                        checked={options.skipPunctuation}
                        onChange={(v) => updateOption('skipPunctuation', v)}
                        label='Punctuation'
                        description='Keep commas, periods, etc.'
                      />
                      <Checkbox
                        checked={options.skipSpelling}
                        onChange={(v) => updateOption('skipSpelling', v)}
                        label='Spelling'
                        description="Don't fix misspellings"
                      />
                      <Checkbox
                        checked={options.skipStyle}
                        onChange={(v) => updateOption('skipStyle', v)}
                        label='Style & clarity'
                        description='Only fix hard errors'
                      />
                      <Checkbox
                        checked={options.skipSentenceStructure}
                        onChange={(v) =>
                          updateOption('skipSentenceStructure', v)
                        }
                        label='Sentence structure'
                        description='Keep run-ons & fragments'
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className='flex items-center mt-6 gap-4'>
              <CharCount count={text.length} />
              <span className='text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-neutral-500'>
                {text.split(/\s+/).filter((w) => w.length > 0).length} words
              </span>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className='bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden flex flex-col min-h-[400px] max-h-[calc(100vh-12rem)] transition-colors duration-300 h-full'>
          <div className='p-4 border-b border-gray-50 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-800/30 flex justify-between items-center'>
            <span className='text-sm font-medium text-gray-500 dark:text-neutral-400'>
              Corrected Text{' '}
              <span className='italic text-gray-500'>(Scrollable)</span>
            </span>
            {result && <CopyButton text={result.correctedText} />}
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
                  <p className='text-sm'>Analyzing sentence structure...</p>
                </motion.div>
              ) : error ? (
                <motion.div
                  key='error'
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className='h-full flex flex-col items-center justify-center text-center p-6 gap-4'
                >
                  <div className='w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500'>
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h3 className='text-sm font-semibold text-gray-900 dark:text-neutral-100 mb-1'>
                      Analysis Failed
                    </h3>
                    <p className='text-xs text-gray-500 dark:text-neutral-400 max-w-[200px] leading-relaxed'>
                      {error}
                    </p>
                  </div>
                  <button
                    onClick={handleCheck}
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
                    {result.correctedText}
                  </div>

                  {result.explanations && result.explanations.length > 0 && (
                    <div className='space-y-4 pt-6 border-t border-gray-100 dark:border-neutral-800'>
                      <h3 className='text-sm font-semibold text-gray-900 dark:text-neutral-100 uppercase tracking-wider'>
                        Corrections & Explanations
                      </h3>
                      <div className='flex flex-col gap-3'>
                        {result.explanations.map((exp, idx) => (
                          <div
                            key={idx}
                            className='bg-gray-50 dark:bg-neutral-800/50 rounded-2xl p-4 text-sm'
                          >
                            <div className='flex items-center gap-3 mb-2'>
                              <span className='text-red-500 dark:text-red-400 line-through decoration-red-200 dark:decoration-red-900/50'>
                                {exp.original}
                              </span>
                              <ArrowRight
                                size={14}
                                className='text-gray-400 dark:text-neutral-500'
                              />
                              <span className='text-green-600 dark:text-green-400 font-medium'>
                                {exp.correction}
                              </span>
                            </div>
                            <p className='text-gray-600 dark:text-neutral-400 leading-relaxed'>
                              {exp.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.explanations && result.explanations.length === 0 && (
                    <div className='flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl'>
                      <CheckCircle2 size={20} />
                      <span className='font-medium'>
                        Looks good! No major grammar issues found.
                      </span>
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
                    <AlertCircle
                      size={24}
                      className='text-gray-300 dark:text-neutral-600'
                    />
                  </div>
                  <p className='text-sm'>
                    Your corrected text will appear here.
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
