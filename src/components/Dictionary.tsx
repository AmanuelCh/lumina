import { useState, KeyboardEvent } from 'react';
import { lookupWord } from '../services/ai';
import {
  Loader2,
  BookOpen,
  Search,
  Volume2,
  Lightbulb,
  Quote,
  AlertTriangle,
  Sparkles,
  ArrowRightLeft,
  MessageSquareQuote,
  BarChart3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type LookupResult = {
  entry: string;
  pronunciation: string;
  partOfSpeech: string[];
  definitions: {
    meaning: string;
    examples: string[];
    register: string;
  }[];
  etymology: string;
  collocations: {
    pattern: string;
    example: string;
  }[];
  synonyms: {
    word: string;
    nuance: string;
  }[];
  antonyms: string[];
  relatedIdioms: {
    idiom: string;
    meaning: string;
    example: string;
  }[];
  commonMistakes: {
    mistake: string;
    correction: string;
  }[];
  memoryTip: string;
  frequencyLevel: string;
};

export function Dictionary() {
  const [query, setQuery] = useState('');
  const [isLooking, setIsLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);

  const handleLookup = async () => {
    if (!query.trim()) return;
    setIsLooking(true);
    setError(null);
    try {
      const res = await lookupWord(query.trim());
      setResult(res);
    } catch (err: any) {
      setError(
        err?.message || 'An unexpected error occurred. Please try again.',
      );
      console.error(err);
    } finally {
      setIsLooking(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLookup();
    }
  };

  const getRegisterColor = (register: string) => {
    const r = register.toLowerCase();
    if (r.includes('formal'))
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    if (r.includes('informal') || r.includes('casual'))
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
    if (r.includes('slang'))
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
    if (r.includes('technical'))
      return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300';
    if (r.includes('literary'))
      return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300';
    if (r.includes('archaic'))
      return 'bg-stone-200 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400';
    return 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400';
  };

  const getFrequencyColor = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('essential'))
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
    if (l.includes('common'))
      return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    if (l.includes('intermediate'))
      return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
    if (l.includes('advanced'))
      return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
    return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20';
  };

  return (
    <div className='flex flex-col gap-8 flex-1'>
      <header>
        <h1 className='text-4xl font-light tracking-tight mb-2 dark:text-white'>
          Dictionary
        </h1>
        <p className='text-gray-500 dark:text-neutral-400'>
          Look up any word, expression, idiom, or collocation — with meanings,
          examples, etymology, and learning aids.
        </p>
      </header>

      {/* Search Bar */}
      <div className='bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 p-2 flex items-center gap-3 transition-colors duration-300'>
        <div className='pl-4 text-gray-400 dark:text-neutral-500'>
          <Search size={20} />
        </div>
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Search a word, phrase, idiom, or expression...'
          className='flex-1 py-3 bg-transparent focus:outline-none text-lg text-gray-800 dark:text-neutral-200 placeholder:text-gray-300 dark:placeholder:text-neutral-600 font-serif'
        />
        <button
          onClick={handleLookup}
          disabled={isLooking || !query.trim()}
          className='px-6 py-2.5 rounded-xl font-medium text-sm hidden sm:flex items-center gap-2 transition-all bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isLooking ? (
            <Loader2
              className='animate-spin'
              size={16}
            />
          ) : (
            <BookOpen size={16} />
          )}
          {isLooking ? 'Looking up...' : 'Look up'}
        </button>
      </div>

      <button
        onClick={handleLookup}
        disabled={isLooking || !query.trim()}
        className='px-6 py-4 rounded-xl font-medium text-sm flex sm:hidden items-center gap-2 transition-all bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed w-max'
      >
        {isLooking ? (
          <Loader2
            className='animate-spin'
            size={16}
          />
        ) : (
          <BookOpen size={16} />
        )}
        {isLooking ? 'Looking up...' : 'Look up'}
      </button>

      {/* Results */}
      <AnimatePresence mode='wait'>
        {isLooking ? (
          <motion.div
            key='loading'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='flex flex-col items-center justify-center py-24 text-gray-400 dark:text-neutral-500 gap-4'
          >
            <Loader2
              className='animate-spin'
              size={32}
            />
            <p className='text-sm'>Analyzing "{query}"...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            key='error'
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='flex flex-col items-center justify-center py-24 text-center gap-4'
          >
            <div className='w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500'>
              <BookOpen
                size={24}
                className='animate-pulse'
              />
            </div>
            <div>
              <h3 className='text-sm font-semibold text-gray-900 dark:text-neutral-100 mb-1'>
                Lookup Failed
              </h3>
              <p className='text-xs text-gray-500 dark:text-neutral-400 max-w-[250px] leading-relaxed'>
                {error}
              </p>
            </div>
            <button
              onClick={handleLookup}
              className='text-xs font-semibold text-red-600 dark:text-red-400 hover:underline'
            >
              Try again
            </button>
          </motion.div>
        ) : result ? (
          <motion.div
            key='result'
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className='flex flex-col gap-6'
          >
            {/* Word Header */}
            <div className='bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 p-6 md:p-8 transition-colors duration-300'>
              <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
                <div>
                  <h2 className='text-3xl md:text-4xl font-serif font-medium text-gray-900 dark:text-white mb-2'>
                    {result.entry}
                  </h2>
                  <div className='flex items-center gap-3 flex-wrap'>
                    <span className='flex items-center gap-1.5 text-gray-500 dark:text-neutral-400 font-mono text-sm'>
                      <Volume2
                        size={14}
                        className='shrink-0'
                      />
                      {result.pronunciation}
                    </span>
                    <span className='text-gray-200 dark:text-neutral-700'>
                      •
                    </span>
                    {result.partOfSpeech.map((pos) => (
                      <span
                        key={pos}
                        className='text-xs font-semibold italic text-gray-500 dark:text-neutral-400'
                      >
                        {pos}
                      </span>
                    ))}
                  </div>
                </div>
                <div className='flex items-center gap-2 shrink-0'>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg ${getFrequencyColor(result.frequencyLevel)}`}
                  >
                    {result.frequencyLevel}
                  </span>
                </div>
              </div>
            </div>

            {/* Definitions */}
            <div className='bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden transition-colors duration-300'>
              <div className='p-4 border-b border-gray-50 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-800/30'>
                <span className='text-sm font-medium text-gray-500 dark:text-neutral-400'>
                  Definitions
                </span>
              </div>
              <div className='p-6 md:p-8 flex flex-col gap-8'>
                {result.definitions.map((def, i) => (
                  <div
                    key={i}
                    className='flex gap-4'
                  >
                    <span className='text-lg font-semibold text-gray-300 dark:text-neutral-600 mt-0.5 shrink-0 font-mono w-6 text-right'>
                      {i + 1}
                    </span>
                    <div className='flex-1'>
                      <div className='flex flex-col sm:flex-row pb-4 sm:pb-0 items-start gap-4 sm:gap-2 mb-3'>
                        <p className='text-gray-800 dark:text-neutral-200 leading-relaxed'>
                          {def.meaning}
                        </p>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 mt-0.5 ${getRegisterColor(def.register)}`}
                        >
                          {def.register}
                        </span>
                      </div>
                      <div className='flex flex-col gap-2 ml-0.5'>
                        {def.examples.map((ex, j) => (
                          <div
                            key={j}
                            className='flex items-start gap-2 text-sm'
                          >
                            <span className='text-gray-300 dark:text-neutral-600 mt-0.5 select-none'>
                              "
                            </span>
                            <p className='italic text-gray-600 dark:text-neutral-400 leading-relaxed'>
                              {ex}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Two-column grid for supplementary sections */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Etymology */}
              {result.etymology && (
                <div className='bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden transition-colors duration-300'>
                  <div className='p-4 border-b border-gray-50 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-800/30 flex items-center gap-2'>
                    <BookOpen
                      size={14}
                      className='text-gray-400 dark:text-neutral-500'
                    />
                    <span className='text-sm font-medium text-gray-500 dark:text-neutral-400'>
                      Etymology
                    </span>
                  </div>
                  <div className='p-6'>
                    <p className='text-sm text-gray-600 dark:text-neutral-400 leading-relaxed'>
                      {result.etymology}
                    </p>
                  </div>
                </div>
              )}

              {/* Memory Tip */}
              {result.memoryTip && (
                <div className='bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden transition-colors duration-300'>
                  <div className='p-4 border-b border-gray-50 dark:border-neutral-800/50 bg-amber-50/50 dark:bg-amber-900/10 flex items-center gap-2'>
                    <Lightbulb
                      size={14}
                      className='text-amber-500 dark:text-amber-400'
                    />
                    <span className='text-sm font-medium text-amber-700 dark:text-amber-400'>
                      Memory Tip
                    </span>
                  </div>
                  <div className='p-6'>
                    <p className='text-sm text-gray-600 dark:text-neutral-400 leading-relaxed'>
                      {result.memoryTip}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Collocations */}
            {result.collocations.length > 0 && (
              <div className='bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden transition-colors duration-300'>
                <div className='p-4 border-b border-gray-50 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-800/30 flex items-center gap-2'>
                  <BarChart3
                    size={14}
                    className='text-gray-400 dark:text-neutral-500'
                  />
                  <span className='text-sm font-medium text-gray-500 dark:text-neutral-400'>
                    Collocations
                  </span>
                </div>
                <div className='p-6 md:p-8'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {result.collocations.map((col, i) => (
                      <div
                        key={i}
                        className='bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-4 transition-colors'
                      >
                        <p className='font-semibold text-sm text-gray-800 dark:text-neutral-200 mb-1.5'>
                          {col.pattern}
                        </p>
                        <p className='text-xs italic text-gray-500 dark:text-neutral-500 leading-relaxed'>
                          "{col.example}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Synonyms & Antonyms */}
            <div className='grid grid-cols-1 items-start lg:grid-cols-2 gap-6'>
              {result.synonyms.length > 0 && (
                <div className='bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden transition-colors duration-300'>
                  <div className='p-4 border-b border-gray-50 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-800/30 flex items-center gap-2'>
                    <ArrowRightLeft
                      size={14}
                      className='text-gray-400 dark:text-neutral-500'
                    />
                    <span className='text-sm font-medium text-gray-500 dark:text-neutral-400'>
                      Synonyms
                    </span>
                  </div>
                  <div className='p-6 flex flex-col gap-4'>
                    {result.synonyms.map((syn, i) => (
                      <div
                        key={i}
                        className='flex flex-col items-start gap-3'
                      >
                        <span className='font-semibold text-sm text-gray-800 dark:text-neutral-200 shrink-0 min-w-[80px]'>
                          {syn.word}
                        </span>
                        <span className='text-xs text-gray-500 dark:text-neutral-500 leading-relaxed'>
                          {syn.nuance}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.antonyms.length > 0 && (
                <div className='bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden transition-colors duration-300'>
                  <div className='p-4 border-b border-gray-50 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-800/30 flex items-center gap-2'>
                    <Sparkles
                      size={14}
                      className='text-gray-400 dark:text-neutral-500'
                    />
                    <span className='text-sm font-medium text-gray-500 dark:text-neutral-400'>
                      Antonyms
                    </span>
                  </div>
                  <div className='p-6'>
                    <div className='flex flex-wrap gap-2'>
                      {result.antonyms.map((ant, i) => (
                        <span
                          key={i}
                          className='px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-neutral-800/50 text-sm font-medium text-gray-700 dark:text-neutral-300'
                        >
                          {ant}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Related Idioms */}
            {result.relatedIdioms.length > 0 && (
              <div className='bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden transition-colors duration-300'>
                <div className='p-4 border-b border-gray-50 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-800/30 flex items-center gap-2'>
                  <MessageSquareQuote
                    size={14}
                    className='text-gray-400 dark:text-neutral-500'
                  />
                  <span className='text-sm font-medium text-gray-500 dark:text-neutral-400'>
                    Related Idioms & Expressions
                  </span>
                </div>
                <div className='p-6 md:p-8 flex flex-col gap-6'>
                  {result.relatedIdioms.map((idiom, i) => (
                    <div
                      key={i}
                      className='flex gap-4'
                    >
                      <Quote
                        size={16}
                        className='text-gray-300 dark:text-neutral-600 mt-0.5 shrink-0'
                      />
                      <div>
                        <p className='font-semibold text-sm text-gray-800 dark:text-neutral-200 mb-1'>
                          {idiom.idiom}
                        </p>
                        <p className='text-xs text-gray-500 dark:text-neutral-400 mb-2 leading-relaxed'>
                          {idiom.meaning}
                        </p>
                        <p className='text-xs italic text-gray-400 dark:text-neutral-500'>
                          "{idiom.example}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Common Mistakes */}
            {result.commonMistakes.length > 0 && (
              <div className='bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden transition-colors duration-300'>
                <div className='p-4 border-b border-gray-50 dark:border-neutral-800/50 bg-red-50/50 dark:bg-red-900/10 flex items-center gap-2'>
                  <AlertTriangle
                    size={14}
                    className='text-red-500 dark:text-red-400'
                  />
                  <span className='text-sm font-medium text-red-700 dark:text-red-400'>
                    Common Mistakes
                  </span>
                </div>
                <div className='p-6 md:p-8 flex flex-col gap-5'>
                  {result.commonMistakes.map((cm, i) => (
                    <div
                      key={i}
                      className='bg-red-50/30 dark:bg-red-900/5 rounded-xl p-4 border border-red-100 dark:border-red-900/20'
                    >
                      <p className='text-sm font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-2'>
                        <span className='opacity-70'>{cm.mistake}</span>
                      </p>
                      <p className='text-sm text-gray-600 dark:text-neutral-400 leading-relaxed'>
                        ✓ {cm.correction}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key='empty'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-neutral-500 gap-4'
          >
            <div className='w-16 h-16 rounded-full bg-gray-50 dark:bg-neutral-800/50 flex items-center justify-center'>
              <BookOpen
                size={24}
                className='text-gray-300 dark:text-neutral-600'
              />
            </div>
            <div className='text-center'>
              <p className='text-sm mb-1'>
                Search any word, phrase, or expression.
              </p>
              <p className='text-xs text-gray-300 dark:text-neutral-600'>
                Try "serendipity", "break the ice", or "make up for"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
