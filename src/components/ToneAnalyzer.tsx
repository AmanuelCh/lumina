import { useState, KeyboardEvent } from 'react';
import { analyzeTone, shiftTone, MAX_INPUT_CHARACTERS } from '../services/ai';
import {
  Loader2,
  Activity,
  Smile,
  MessageSquareQuote,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  AlertCircle,
  CircleAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CopyButton } from './CopyButton';
import { PaneLayout, OptionsStyle } from '../services/settings';
import { CharCount } from './CharCount';
import { OptionsControl } from './ui/OptionsControl';

const SHIFT_TONES = [
  { id: 'confident', label: 'Confident', desc: 'Assertive and self-assured' },
  {
    id: 'empathetic',
    label: 'Empathetic',
    desc: 'Understanding and compassionate',
  },
  { id: 'direct', label: 'Direct', desc: 'Concise and to-the-point' },
  { id: 'enthusiastic', label: 'Enthusiastic', desc: 'Energetic and positive' },
  { id: 'sincere', label: 'Sincere', desc: 'Honest and heartfelt' },
  {
    id: 'authoritative',
    label: 'Authoritative',
    desc: 'Commanding and expert',
  },
];

interface ToneAnalyzerProps {
  layout: PaneLayout;
  optionsStyle: OptionsStyle;
}

export function ToneAnalyzer({ layout, optionsStyle }: ToneAnalyzerProps) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'analyze' | 'shift'>('analyze');
  const [selectedTargetTone, setSelectedTargetTone] = useState('confident');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analysis Result
  const [analysisResult, setAnalysisResult] = useState<{
    primaryTone: string;
    secondaryTones: string[];
    analysis: string;
    formalityScore: number;
  } | null>(null);

  // Shifting Result
  const [shiftedResult, setShiftedResult] = useState<{
    shiftedText: string;
    explanation: string;
  } | null>(null);

  const isOverLimit = text.length > MAX_INPUT_CHARACTERS;

  const handleProcess = async () => {
    if (!text.trim() || isOverLimit) return;
    setIsProcessing(true);
    setError(null);
    try {
      if (mode === 'analyze') {
        const res = await analyzeTone(text);
        setAnalysisResult(res);
      } else {
        const res = await shiftTone(text, selectedTargetTone);
        setShiftedResult(res);
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

  return (
    <div className='flex flex-col gap-8 text-left flex-1'>
      <header>
        <h1 className='text-4xl font-light tracking-tight mb-2 dark:text-white'>
          Tone Analyzer
        </h1>
        <p className='text-gray-500 dark:text-neutral-400'>
          Analyze emotional resonance or shift your writing to a new frequency.
        </p>
      </header>

      {/* Mode Selector */}
      <div className='self-start'>
        <OptionsControl
          value={mode}
          options={[
            {
              value: 'analyze',
              label: 'Analyze Tone',
              description: 'Analyze emotional resonance',
            },
            {
              value: 'shift',
              label: 'Shift Tone',
              description: 'Transform into a new frequency',
            },
          ]}
          onChange={(v) => setMode(v as 'analyze' | 'shift')}
          style={optionsStyle}
          tabsClassName='w-max'
          dropdownClassName='w-[200px]'
        />
      </div>

      <AnimatePresence mode='wait'>
        {mode === 'shift' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className='self-start'
          >
            <OptionsControl
              value={selectedTargetTone}
              options={SHIFT_TONES.map((t) => ({
                value: t.id,
                label: t.label,
                description: t.desc,
              }))}
              onChange={setSelectedTargetTone}
              style={optionsStyle}
              className='w-full sm:w-auto'
              dropdownClassName='sm:w-[300px]'
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`grid items-start gap-6 flex-1 ${gridClass}`}>
        {/* Input Section */}
        <div className='bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden flex flex-col transition-colors duration-300 h-full'>
          <div className='p-4 border-b border-gray-50 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-800/30 flex justify-between items-center transition-colors'>
            <span className='text-sm font-medium text-gray-500 dark:text-neutral-400 font-sans'>
              {mode === 'analyze' ? 'Text to Analyze' : 'Text to Transform'}
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
                mode === 'analyze'
                  ? 'Paste text to analyze its tone...'
                  : 'Paste text to change its tone...'
              }
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
              onClick={handleProcess}
              disabled={isProcessing || !text.trim() || isOverLimit}
              className={`px-6 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 transition-all ${isOverLimit ? 'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-600' : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isProcessing ? (
                <Loader2
                  className='animate-spin'
                  size={16}
                />
              ) : mode === 'analyze' ? (
                <Activity size={16} />
              ) : (
                <Sparkles size={16} />
              )}
              {isProcessing
                ? mode === 'analyze'
                  ? 'Analyzing...'
                  : 'Transforming...'
                : mode === 'analyze'
                  ? 'Analyze Tone'
                  : `Shift to ${SHIFT_TONES.find((t) => t.id === selectedTargetTone)?.label}`}
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className='bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden flex flex-col min-h-[400px] max-h-[calc(100vh-12rem)] transition-colors duration-300 h-full'>
          <div className='p-4 border-b border-gray-50 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-800/30 flex justify-between items-center'>
            <span className='text-sm font-medium text-gray-500 dark:text-neutral-400'>
              {mode === 'analyze' ? 'Analysis Results' : 'Transformed Text'}
            </span>
            {mode === 'analyze' && analysisResult && (
              <CopyButton
                text={`Primary Tone: ${analysisResult.primaryTone}\nSecondary Tones: ${analysisResult.secondaryTones.join(', ')}\nFormality Score: ${analysisResult.formalityScore}/10\n\nAnalysis:\n${analysisResult.analysis}`}
              />
            )}
            {mode === 'shift' && shiftedResult && (
              <CopyButton text={shiftedResult.shiftedText} />
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
                    {mode === 'analyze'
                      ? 'Reading between the lines...'
                      : `Infusing with ${selectedTargetTone} energy...`}
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
                      Processing Failed
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
              ) : mode === 'analyze' && analysisResult ? (
                <motion.div
                  key='analysis-result'
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='flex flex-col gap-8'
                >
                  <div className='flex flex-col items-center text-center p-6 bg-linear-to-b from-gray-50 to-white dark:from-neutral-800/50 dark:to-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800'>
                    <Smile
                      size={32}
                      className='text-gray-400 dark:text-neutral-500 mb-3'
                    />
                    <div className='text-sm font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-widest mb-1'>
                      Primary Tone
                    </div>
                    <div className='text-3xl font-semibold text-gray-900 dark:text-white'>
                      {analysisResult.primaryTone}
                    </div>
                  </div>

                  {analysisResult.secondaryTones?.length > 0 && (
                    <div>
                      <div className='text-sm font-semibold text-gray-900 dark:text-neutral-100 uppercase tracking-wider mb-3'>
                        Secondary Tones
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {analysisResult.secondaryTones.map((tone, idx) => (
                          <span
                            key={idx}
                            className='px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 rounded-lg text-sm font-medium'
                          >
                            {tone}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className='flex justify-between items-end mb-2'>
                      <div className='text-sm font-semibold text-gray-900 dark:text-neutral-100 uppercase tracking-wider'>
                        Formality Score
                      </div>
                      <div className='text-sm font-medium text-gray-500 dark:text-neutral-400'>
                        {analysisResult.formalityScore} / 10
                      </div>
                    </div>
                    <div className='h-2 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden'>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(analysisResult.formalityScore / 10) * 100}%`,
                        }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className='h-full bg-black dark:bg-white rounded-full'
                      />
                    </div>
                  </div>

                  <div className='pt-6 border-t border-gray-100 dark:border-neutral-800'>
                    <div className='flex items-center gap-2 mb-3 text-gray-900 dark:text-neutral-100 font-semibold uppercase tracking-wider text-sm'>
                      <MessageSquareQuote size={16} />
                      Detailed Analysis
                    </div>
                    <p className='text-gray-600 dark:text-neutral-400 leading-relaxed text-sm'>
                      {analysisResult.analysis}
                    </p>
                  </div>
                </motion.div>
              ) : mode === 'shift' && shiftedResult ? (
                <motion.div
                  key='shift-result'
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='flex flex-col gap-8'
                >
                  <div className='font-serif text-lg leading-relaxed text-gray-800 dark:text-neutral-200'>
                    {shiftedResult.shiftedText}
                  </div>

                  {shiftedResult.explanation && (
                    <div className='pt-6 border-t border-gray-100 dark:border-neutral-800'>
                      <div className='bg-purple-50/50 dark:bg-purple-900/20 rounded-2xl p-4 text-sm'>
                        <div className='flex items-center gap-2 mb-2 text-purple-700 dark:text-purple-400 font-medium'>
                          <SlidersHorizontal size={16} />
                          Transformation Notes
                        </div>
                        <p className='text-gray-600 dark:text-neutral-400 leading-relaxed'>
                          {shiftedResult.explanation}
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
                    {mode === 'analyze' ? (
                      <Activity size={24} />
                    ) : (
                      <Shuffle size={24} />
                    )}
                  </div>
                  <p className='text-sm'>
                    {mode === 'analyze'
                      ? 'Your tone analysis will appear here.'
                      : 'Your transformed text will appear here.'}
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
