import { useState, useEffect } from 'react';
import { GrammarChecker } from './components/GrammarChecker';
import { Paraphraser } from './components/Paraphraser';
import { Summarizer } from './components/Summarizer';
import { ToneAnalyzer } from './components/ToneAnalyzer';
import { PromptSuite } from './components/PromptSuite';
import { Humanizer } from './components/Humanizer';
import { Translator } from './components/Translator';
import { Dictionary } from './components/Dictionary';
import { SettingsManager } from './components/SettingsManager';
import { Sidebar } from './components/Sidebar';
import { ApiKeyGate } from './components/ApiKeyGate';
import {
  getSettings,
  saveSettings,
  AppTab,
  AppSettings,
} from './services/settings';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [activeTab, setActiveTab] = useState<AppTab>(settings.defaultTab);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    saveSettings(newSettings);
  };

  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) root.classList.add('dark');
        else root.classList.remove('dark');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key === 'b') {
        e.preventDefault();
        updateSettings({ sidebarCollapsed: !settings.sidebarCollapsed });
      }

      if (isMod && e.key === 'l' && !e.shiftKey) {
        e.preventDefault();
        updateSettings({
          layout:
            settings.layout === 'side-by-side' ? 'stacked' : 'side-by-side',
        });
      }

      if (isMod && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
      }

      if (isMod && e.key === ',') {
        e.preventDefault();
        setActiveTab('settings');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings, setActiveTab]);

  // Show API key gate if no key is configured
  if (!settings.apiKey.trim()) {
    return (
      <ApiKeyGate
        onSubmit={(key) => {
          updateSettings({ apiKey: key });
        }}
      />
    );
  }

  return (
    <div className='h-screen flex flex-col md:flex-row bg-[#fdfdfd] dark:bg-neutral-950 transition-colors duration-300 overflow-hidden'>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={settings.sidebarCollapsed}
        onToggleCollapse={() =>
          updateSettings({ sidebarCollapsed: !settings.sidebarCollapsed })
        }
        isMobileOpen={isMobileMenuOpen}
        onToggleMobile={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Content */}
      <main className='flex-1 flex flex-col min-w-0 h-full overflow-y-auto'>
        <div className='flex-1 p-6 md:p-12 flex flex-col'>
          <div className='max-w-5xl mx-auto w-full flex-1 flex flex-col'>
            {activeTab === 'grammar' && (
              <GrammarChecker
                preserveInformalityDefault={settings.preserveInformality}
                layout={settings.layout}
              />
            )}
            {activeTab === 'paraphrase' && (
              <Paraphraser 
                layout={settings.layout} 
                optionsStyle={settings.optionsStyle} 
              />
            )}
            {activeTab === 'summarize' && (
              <Summarizer 
                layout={settings.layout} 
                optionsStyle={settings.optionsStyle}
              />
            )}
            {activeTab === 'tone' && (
              <ToneAnalyzer 
                layout={settings.layout} 
                optionsStyle={settings.optionsStyle}
              />
            )}
            {activeTab === 'humanizer' && (
              <Humanizer 
                layout={settings.layout} 
                optionsStyle={settings.optionsStyle}
              />
            )}
            {activeTab === 'prompt' && (
              <PromptSuite 
                layout={settings.layout} 
                optionsStyle={settings.optionsStyle}
              />
            )}
            {activeTab === 'translate' && (
              <Translator 
                layout={settings.layout} 
                optionsStyle={settings.optionsStyle}
              />
            )}
            {activeTab === 'dictionary' && (
              <Dictionary />
            )}
            {activeTab === 'settings' && (
              <SettingsManager
                settings={settings}
                onUpdate={updateSettings}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
