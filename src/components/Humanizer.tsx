import { useState, KeyboardEvent } from 'react';
import {
  humanizeAndDetect,
  detectAI,
  MAX_INPUT_CHARACTERS,
} from '../services/ai';
import {
  Loader2,
  ShieldCheck,
  User,
  Sparkles,
  AlertTriangle,
  BrainCircuit,
  Activity,
  Search,
  AlertCircle,
  CircleAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CopyButton } from './CopyButton';
import { PaneLayout, OptionsStyle } from '../services/settings';
import { CharCount } from './CharCount';
import { OptionsControl } from './ui/OptionsControl';

interface HumanizerProps {
  layout: PaneLayout;
  optionsStyle: OptionsStyle;
}

type Mode = 'detect' | 'humanize';

export function Humanizer({ layout, optionsStyle }: HumanizerProps) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<Mode>('detect');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detectResult, setDetectResult] = useState<{
    aiScore: number;
    detectionAnalysis: string;
    markers: string[];
  } | null>(null);

  const [humanizeResult, setHumanizeResult] = useState<{
    humanizedText: string;
    aiScore: number;
    detectionAnalysis: string;
    improvements: string[];
  } | null>(null);

  const isOverLimit = text.length > MAX_INPUT_CHARACTERS;

  const handleProcess = async () => {
    if (!text.trim() || isOverLimit) return;
    setIsProcessing(true);
    setError(null);
    try {
      if (mode === 'detect') {
        const res = await detectAI(text);
        setDetectResult(res);
      } else {
        const res = await humanizeAndDetect(text);
        setHumanizeResult(res);
      }
    } catch (err: any) {
      setError(
        err?.message || 'An unexpected error occurred. Please try again.',
      );
      console.error(err);
    } finally {
      setIsProcessing(false);
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

  const getScoreColor = (score: number) => {
    if (score < 30) return 'text-green-600 dark:text-green-400';
    if (score < 70) return 'text-amber-500 dark:text-amber-400';
    return 'text-red-500 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score < 30) return 'bg-green-50 dark:bg-green-900/20';
    if (score < 70) return 'bg-amber-50 dark:bg-amber-900/20';
    return 'bg-red-50 dark:bg-red-900/20';
  };

  const currentResult = mode === 'detect' ? detectResult : humanizeResult;

  return (
    <div className='flex flex-col gap-8 text-left flex-1'>
      <header>
        <h1 className='text-4xl font-light tracking-tight mb-2 dark:text-white'>
          Humanizer & Detector
        </h1>
        <p className='text-gray-500 dark:text-neutral-400'>
          Detect AI fingerprints and transform them into authentic human prose.
        </p>
      </header>

      {/* Mode Selector */}
      <div className='self-start'>
        <OptionsControl
          value={mode}
          options={[
            {
              value: 'detect',
              label: 'AI Detector',
              description: 'Scan for AI fingerprints',
            },
            {
              value: 'humanize',
              label: 'Humanizer',
              description: 'Transform into human prose',
            },
          ]}
          onChange={(v) => setMode(v as Mode)}
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
              Text to {mode === 'detect' ? 'Scan' : 'Humanize'}
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
              placeholder={
                mode === 'detect'
                  ? 'Paste text to check for AI patterns...'
                  : 'Paste text to transform into natural human writing...'
              }
              className={`flex-1 p-6 ${isOverLimit ? 'pt-14' : ''} resize-none focus:outline-none font-serif text-lg leading-relaxed text-gray-800 dark:text-neutral-200 placeholder:text-gray-300 dark:placeholder-neutral-600 bg-transparent transition-all duration-300 ${isOverLimit ? 'bg-red-50/10 dark:bg-red-950/5' : ''}`}
            />
          </div>
          <div className='p-4 border-t border-gray-50 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-800/30 flex flex-col-reverse 2xl:flex-row 2xl:justify-between items-start 2xl:items-center transition-colors'>
            <div className='flex items-center mt-6 2xl:mt-0 gap-4'>
              <CharCount count={text.length} />
              <span className='text-[10px] uppercase font-bold tracking-widest text-gray-400 dark:text-neutral-500'>
                {text.split(/\s+/).filter((w) => w.length > 0).length} words
              </span>
            </div>
            <button
              onClick={handleProcess}
              disabled={isProcessing || !text.trim() || isOverLimit}
              className={`px-6 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 transition-all ${isOverLimit ? 'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-600' : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isProcessing ? (
                <Loader2
                  className='animate-spin'
                  size={16}
                />
              ) : mode === 'detect' ? (
                <Search size={16} />
              ) : (
                <BrainCircuit size={16} />
              )}
              {isProcessing
                ? 'Processing...'
                : mode === 'detect'
                  ? 'Run AI Scan'
                  : 'Humanize Text'}
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className='bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden flex flex-col min-h-[400px] max-h-[calc(100vh-12rem)] transition-colors duration-300 h-full'>
          <div className='p-4 border-b border-gray-50 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-800/30 flex justify-between items-center'>
            <span className='text-sm font-medium text-gray-500 dark:text-neutral-400'>
              {mode === 'detect' ? 'Detection Report' : 'Humanized Result'}
            </span>
            {mode === 'humanize' && humanizeResult && (
              <CopyButton text={humanizeResult.humanizedText} />
            )}
          </div>

          <div className='p-6 flex-1 overflow-y-auto'>
            <AnimatePresence mode='wait'>
              {isProcessing ? (
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
                  <p className='text-sm'>
                    {mode === 'detect'
                      ? 'Scanning for AI fingerprints...'
                      : 'Deconstructing robotic syntax...'}
                  </p>
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
                      Humanizer Failed
                    </h3>
                    <p className='text-xs text-gray-500 dark:text-neutral-400 max-w-[200px] leading-relaxed'>
                      {error}
                    </p>
                  </div>
                  <button
                    onClick={handleProcess}
                    className='text-xs font-semibold text-red-600 dark:text-red-400 hover:underline'
                  >
                    Try again
                  </button>
                </motion.div>
              ) : currentResult ? (
                <motion.div
                  key={`${mode}-result`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='flex flex-col gap-8'
                >
                  {/* AI Detection Score (Shared in both modes but styled differently) */}
                  <div
                    className={`p-6 rounded-2xl border border-transparent flex flex-col gap-5 justify-between ${getScoreBg(currentResult.aiScore)}`}
                  >
                    <div className='flex items-center gap-4'>
                      <div
                        className={`p-3 rounded-xl bg-white dark:bg-neutral-900 shadow-sm ${getScoreColor(currentResult.aiScore)}`}
                      >
                        {currentResult.aiScore > 50 ? (
                          <AlertTriangle size={24} />
                        ) : (
                          <ShieldCheck size={24} />
                        )}
                      </div>
                      <div>
                        <div className='text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400 mb-1'>
                          AI Exposure
                        </div>
                        <div
                          className={`text-2xl font-bold ${getScoreColor(currentResult.aiScore)}`}
                        >
                          {currentResult.aiScore}%{' '}
                          <span className='text-sm font-medium opacity-70'>
                            Probability
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getScoreColor(currentResult.aiScore)} border border-current`}
                      >
                        {currentResult.aiScore > 70
                          ? 'Likely AI'
                          : currentResult.aiScore > 30
                            ? 'Mixed'
                            : 'Likely Human'}
                      </span>
                    </div>
                  </div>

                  {mode === 'humanize' && 'humanizedText' in currentResult && (
                    <div className='font-serif text-lg leading-relaxed text-gray-800 dark:text-neutral-200'>
                      {currentResult.humanizedText}
                    </div>
                  )}

                  <div className='space-y-6 pt-6 border-t border-gray-100 dark:border-neutral-800'>
                    {mode === 'detect' && 'markers' in currentResult && (
                      <div>
                        <h3 className='text-sm font-semibold text-gray-900 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-2 mb-3'>
                          <Activity
                            size={16}
                            className='text-purple-500'
                          />
                          AI Markers Found
                        </h3>
                        <div className='flex flex-wrap gap-2'>
                          {currentResult.markers.map((marker, idx) => (
                            <span
                              key={idx}
                              className='px-3 py-1.5 bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 rounded-xl text-xs font-medium border border-gray-100 dark:border-neutral-800/50'
                            >
                              {marker}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {mode === 'humanize' && 'improvements' in currentResult && (
                      <div>
                        <h3 className='text-sm font-semibold text-gray-900 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-2 mb-3'>
                          <Sparkles
                            size={16}
                            className='text-purple-500'
                          />
                          Humanization Choices
                        </h3>
                        <div className='flex flex-wrap gap-2'>
                          {currentResult.improvements.map((imp, idx) => (
                            <span
                              key={idx}
                              className='px-3 py-1.5 bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 rounded-xl text-xs font-medium border border-gray-100 dark:border-neutral-800/50'
                            >
                              {imp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className='text-sm font-semibold text-gray-900 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-2 mb-2'>
                        <Search
                          size={16}
                          className='text-blue-500'
                        />
                        Analysis
                      </h3>
                      <p className='text-gray-600 dark:text-neutral-400 leading-relaxed text-sm'>
                        {currentResult.detectionAnalysis}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key='empty'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='h-full flex flex-col items-center justify-center text-gray-400 dark:text-neutral-500 gap-4'
                >
                  <div className='w-16 h-16 rounded-full bg-gray-50 dark:bg-neutral-800/50 flex items-center justify-center'>
                    {mode === 'detect' ? (
                      <Search size={24} />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  <p className='text-sm text-center max-w-[250px]'>
                    {mode === 'detect'
                      ? 'Your AI detection report will appear here.'
                      : 'Your humanized text will appear here.'}
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
