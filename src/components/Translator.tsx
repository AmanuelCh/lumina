import { useState, KeyboardEvent } from 'react';
import { translateText, MAX_INPUT_CHARACTERS } from '../services/ai';
import {
  Loader2,
  Languages,
  ArrowRightLeft,
  CircleAlert,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CopyButton } from './CopyButton';
import { PaneLayout, OptionsStyle } from '../services/settings';
import { CharCount } from './CharCount';
import { Selector } from './ui/Selector';

const LANGUAGES = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'Afrikaans', label: 'Afrikaans' },
  { value: 'Albanian', label: 'Albanian' },
  { value: 'Amharic', label: 'Amharic' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Armenian', label: 'Armenian' },
  { value: 'Assamese', label: 'Assamese' },
  { value: 'Azerbaijani', label: 'Azerbaijani' },
  { value: 'Basque', label: 'Basque' },
  { value: 'Belarusian', label: 'Belarusian' },
  { value: 'Bengali', label: 'Bengali' },
  { value: 'Bosnian', label: 'Bosnian' },
  { value: 'Bulgarian', label: 'Bulgarian' },
  { value: 'Catalan', label: 'Catalan' },
  { value: 'Cebuano', label: 'Cebuano' },
  { value: 'Chinese (Simplified)', label: 'Chinese (Simplified)' },
  { value: 'Chinese (Traditional)', label: 'Chinese (Traditional)' },
  { value: 'Chinese (Hong Kong)', label: 'Chinese (Hong Kong)' },
  { value: 'Croatian', label: 'Croatian' },
  { value: 'Czech', label: 'Czech' },
  { value: 'Danish', label: 'Danish' },
  { value: 'Dutch', label: 'Dutch' },
  { value: 'English (UK)', label: 'English (UK)' },
  { value: 'English (US)', label: 'English (US)' },
  { value: 'Estonian', label: 'Estonian' },
  { value: 'Filipino', label: 'Filipino' },
  { value: 'Finnish', label: 'Finnish' },
  { value: 'French', label: 'French' },
  { value: 'Galician', label: 'Galician' },
  { value: 'Georgian', label: 'Georgian' },
  { value: 'German', label: 'German' },
  { value: 'German (Swiss)', label: 'German (Swiss)' },
  { value: 'Greek', label: 'Greek' },
  { value: 'Gujarati', label: 'Gujarati' },
  { value: 'Hebrew', label: 'Hebrew' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Hungarian', label: 'Hungarian' },
  { value: 'Icelandic', label: 'Icelandic' },
  { value: 'Indonesian', label: 'Indonesian' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Kannada', label: 'Kannada' },
  { value: 'Kazakh', label: 'Kazakh' },
  { value: 'Khmer', label: 'Khmer' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Lao', label: 'Lao' },
  { value: 'Latvian', label: 'Latvian' },
  { value: 'Lithuanian', label: 'Lithuanian' },
  { value: 'Macedonian', label: 'Macedonian' },
  { value: 'Malay', label: 'Malay' },
  { value: 'Malayalam', label: 'Malayalam' },
  { value: 'Marathi', label: 'Marathi' },
  { value: 'Mongolian', label: 'Mongolian' },
  { value: 'Nepali', label: 'Nepali' },
  { value: 'Norwegian', label: 'Norwegian' },
  { value: 'Odia', label: 'Odia' },
  { value: 'Persian (Farsi)', label: 'Persian (Farsi)' },
  { value: 'Polish', label: 'Polish' },
  { value: 'Portuguese (Brazilian)', label: 'Portuguese (Brazilian)' },
  { value: 'Portuguese (European)', label: 'Portuguese (European)' },
  { value: 'Punjabi', label: 'Punjabi' },
  { value: 'Romanian', label: 'Romanian' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Sanskrit', label: 'Sanskrit' },
  { value: 'Serbian', label: 'Serbian' },
  { value: 'Slovak', label: 'Slovak' },
  { value: 'Slovenian', label: 'Slovenian' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'Swahili', label: 'Swahili' },
  { value: 'Swedish', label: 'Swedish' },
  { value: 'Tagalog', label: 'Tagalog' },
  { value: 'Tamil', label: 'Tamil' },
  { value: 'Telugu', label: 'Telugu' },
  { value: 'Thai', label: 'Thai' },
  { value: 'Turkish', label: 'Turkish' },
  { value: 'Ukrainian', label: 'Ukrainian' },
  { value: 'Urdu', label: 'Urdu' },
  { value: 'Uzbek', label: 'Uzbek' },
  { value: 'Vietnamese', label: 'Vietnamese' },
  { value: 'Zulu', label: 'Zulu' },
];

const TARGET_LANGUAGES = LANGUAGES.filter((l) => l.value !== 'auto');

interface TranslatorProps {
  layout: PaneLayout;
  optionsStyle: OptionsStyle;
}

export function Translator({ layout }: TranslatorProps) {
  const [text, setText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    translatedText: string;
    detectedSourceLang: string;
    confidence: number;
    notes: string;
  } | null>(null);

  const isOverLimit = text.length > MAX_INPUT_CHARACTERS;

  const handleTranslate = async () => {
    if (!text.trim() || isOverLimit) return;
    setIsTranslating(true);
    setError(null);
    try {
      const res = await translateText(text, sourceLang, targetLang);
      setResult(res);
    } catch (err: any) {
      setError(
        err?.message || 'An unexpected error occurred. Please try again.',
      );
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') return;
    const prevSource = sourceLang;
    const prevTarget = targetLang;
    setSourceLang(prevTarget);
    setTargetLang(prevSource);

    if (result) {
      setText(result.translatedText);
      setResult(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  const gridClass =
    layout === 'side-by-side' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1';

  const getConfidenceColor = (score: number) => {
    if (score >= 90)
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
    if (score >= 70)
      return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    if (score >= 50)
      return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 90) return 'High confidence';
    if (score >= 70) return 'Good confidence';
    if (score >= 50) return 'Moderate confidence';
    return 'Low confidence';
  };

  return (
    <div className='flex flex-col gap-8 flex-1'>
      <header>
        <h1 className='text-4xl font-light tracking-tight mb-2 dark:text-white'>
          Translate
        </h1>
        <p className='text-gray-500 dark:text-neutral-400'>
          Translate text between 70+ languages with cultural and contextual
          awareness.
        </p>
      </header>

      {/* Language Selectors */}
      <div className='flex items-center gap-3 flex-wrap'>
        <Selector
          value={sourceLang}
          options={LANGUAGES}
          onChange={setSourceLang}
          label='From'
          className='w-[200px]'
        />
        <button
          onClick={handleSwapLanguages}
          disabled={sourceLang === 'auto'}
          className='p-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all mt-5'
          title='Swap languages'
        >
          <ArrowRightLeft
            size={16}
            className='text-gray-500 dark:text-neutral-400'
          />
        </button>
        <Selector
          value={targetLang}
          options={TARGET_LANGUAGES}
          onChange={setTargetLang}
          label='To'
          className='w-[200px]'
        />
      </div>

      <div className={`grid items-start gap-6 flex-1 ${gridClass}`}>
        {/* Input Section */}
        <div className='bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden flex flex-col transition-colors duration-300 h-full'>
          <div className='p-4 border-b border-gray-50 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-800/30 flex justify-between items-center transition-colors'>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium text-gray-500 dark:text-neutral-400 font-sans'>
                Source Text
              </span>
              {sourceLang === 'auto' && (
                <span className='text-[10px] uppercase font-bold tracking-widest text-gray-400 dark:text-neutral-500 bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md'>
                  Auto-detect
                </span>
              )}
            </div>
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
              placeholder='Enter text to translate...'
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
              onClick={handleTranslate}
              disabled={isTranslating || !text.trim() || isOverLimit}
              className={`px-6 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 transition-all ${isOverLimit ? 'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-600' : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isTranslating ? (
                <Loader2
                  className='animate-spin'
                  size={16}
                />
              ) : (
                <Languages size={16} />
              )}
              {isTranslating ? 'Translating...' : 'Translate'}
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className='bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden flex flex-col min-h-[400px] max-h-[calc(100vh-12rem)] transition-colors duration-300 h-full'>
          <div className='p-4 border-b border-gray-50 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-800/30 flex flex-wrap justify-between items-center'>
            <div className='flex items-center gap-3'>
              <span className='text-sm font-medium text-gray-500 dark:text-neutral-400'>
                Translation
              </span>
              {result && (
                <div className='sm:flex items-center gap-2 hidden'>
                  <span className='text-xs text-gray-400 dark:text-neutral-500 bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded-md'>
                    {result.detectedSourceLang} → {targetLang}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-1 rounded-md ${getConfidenceColor(result.confidence)}`}
                  >
                    {result.confidence}% —{' '}
                    {getConfidenceLabel(result.confidence)}
                  </span>
                </div>
              )}
            </div>
            {result && <CopyButton text={result.translatedText} />}

            {result && (
              <div className='flex items-center gap-2 sm:hidden'>
                <span className='text-xs text-gray-400 dark:text-neutral-500 bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded-md'>
                  {result.detectedSourceLang} → {targetLang}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-1 rounded-md ${getConfidenceColor(result.confidence)}`}
                >
                  {result.confidence}% — {getConfidenceLabel(result.confidence)}
                </span>
              </div>
            )}
          </div>

          <div className='p-6 flex-1 overflow-y-auto'>
            <AnimatePresence mode='wait'>
              {isTranslating ? (
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
                  <p className='text-sm'>Translating to {targetLang}...</p>
                </motion.div>
              ) : error ? (
                <motion.div
                  key='error'
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className='h-full flex flex-col items-center justify-center text-center p-6 gap-4'
                >
                  <div className='w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500'>
                    <Languages
                      size={24}
                      className='animate-pulse'
                    />
                  </div>
                  <div>
                    <h3 className='text-sm font-semibold text-gray-900 dark:text-neutral-100 mb-1'>
                      Translation Failed
                    </h3>
                    <p className='text-xs text-gray-500 dark:text-neutral-400 max-w-[200px] leading-relaxed'>
                      {error}
                    </p>
                  </div>
                  <button
                    onClick={handleTranslate}
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
                    {result.translatedText}
                  </div>

                  {result.notes && (
                    <div className='pt-6 border-t border-gray-100 dark:border-neutral-800'>
                      <div className='bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl p-4 text-sm'>
                        <div className='flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-400 font-medium'>
                          <Info size={16} />
                          Translation Notes
                        </div>
                        <p className='text-gray-600 dark:text-neutral-400 leading-relaxed'>
                          {result.notes}
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
                    <Languages
                      size={24}
                      className='text-gray-300 dark:text-neutral-600'
                    />
                  </div>
                  <p className='text-sm'>Your translation will appear here.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
