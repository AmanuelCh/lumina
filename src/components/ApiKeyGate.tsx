import { useState, KeyboardEvent } from 'react';
import {
  Key,
  Feather,
  ArrowRight,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { verifyApiKey } from '../services/ai';

interface ApiKeyGateProps {
  onSubmit: (key: string) => void;
}

export function ApiKeyGate({ onSubmit }: ApiKeyGateProps) {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!key.trim() || isVerifying) return;
    setIsVerifying(true);
    setError(null);

    const result = await verifyApiKey(key);
    setIsVerifying(false);

    if (result.valid) {
      onSubmit(key.trim());
    } else {
      setError(result.error || 'Verification failed.');
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className='h-screen flex items-center justify-center bg-[#fdfdfd] dark:bg-neutral-950 p-6 transition-colors duration-300'>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className='w-full max-w-md'
      >
        {/* Logo area */}
        <div className='text-center mb-10'>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className='mx-auto mb-6 flex justify-center'
          >
            <Feather size={40} className='text-black dark:text-white' />
          </motion.div>
          <h1 className='text-3xl font-light tracking-tight dark:text-white mb-2'>
            Welcome to Lumina
          </h1>
          <p className='text-gray-500 dark:text-neutral-400 text-sm leading-relaxed max-w-xs mx-auto'>
            AI-powered writing tools at your fingertips. Enter your Gemini API
            key to get started.
          </p>
        </div>

        {/* Key input card */}
        <div className='bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 p-6 shadow-sm transition-colors duration-300'>
          <div className='flex items-center gap-2 mb-4'>
            <Key size={16} className='text-gray-400 dark:text-neutral-500' />
            <span className='text-sm font-medium text-gray-700 dark:text-neutral-300'>
              Gemini API Key
            </span>
          </div>

          <div className='relative mb-4'>
            <input
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder='AIzaSy... or promo code'
              autoFocus
              disabled={isVerifying}
              className='w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-neutral-800 rounded-xl text-sm font-mono text-gray-800 dark:text-neutral-200 placeholder:text-gray-300 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:focus:ring-violet-400/20 border border-transparent focus:border-violet-300 dark:focus:border-violet-700 transition-all disabled:opacity-50'
            />
            <button
              type='button'
              onClick={() => setShowKey(!showKey)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors'
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='mb-4 overflow-hidden'
              >
                <div className='flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2.5 rounded-lg'>
                  <AlertCircle size={14} className='shrink-0' />
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleSubmit}
            disabled={!key.trim() || isVerifying}
            className='w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed'
          >
            {isVerifying ? (
              <>
                <Loader2 size={16} className='animate-spin' />
                Verifying...
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        {/* Help text */}
        <div className='mt-6 text-center space-y-3'>
          <a
            href='https://aistudio.google.com/apikey'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors'
          >
            Get a free API key from Google AI Studio
            <ExternalLink size={12} />
          </a>
          <p className='text-[11px] text-gray-400 dark:text-neutral-600'>
            Your key is stored locally in your browser. We never send it to our
            servers.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
