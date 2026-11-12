'use client';

import React, { useState, useEffect } from 'react';

interface Category {
  id: string;
  label: string;
  description: string;
  example: string;
  icon: string;
}

interface ProviderTarget {
  name: string;
  provider: string;
  id: string;
  isConfigured: boolean;
}

interface ConfigInfo {
  primary: ProviderTarget;
  fallbacks: ProviderTarget[];
}

interface EnhanceResponse {
  success: boolean;
  enhancedPrompt: string;
  modelUsed: string;
  providerUsed: string;
  isFallback: boolean;
  chainLog: { target: string; status: 'success' | 'failed' | 'skipped'; reason?: string }[];
  error?: string;
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [config, setConfig] = useState<ConfigInfo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [rawPrompt, setRawPrompt] = useState<string>('');
  const [enhancedResult, setEnhancedResult] = useState<EnhanceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_api_key_override') || '';
    }
    return '';
  });

  useEffect(() => {
    // Fetch initial category list & model setup
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
        if (data.config) setConfig(data.config);
      })
      .catch((err) => console.error('Failed to load config:', err));
  }, []);

  const handleSaveCustomKey = (key: string) => {
    setCustomApiKey(key);
    if (key) {
      localStorage.setItem('user_api_key_override', key);
    } else {
      localStorage.removeItem('user_api_key_override');
    }
  };

  const handleEnhance = async () => {
    if (!rawPrompt.trim() || loading) return;

    setLoading(true);
    setErrorMessage(null);
    setEnhancedResult(null);

    try {
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: rawPrompt,
          categoryId: selectedCategory,
          apiKeyOverride: customApiKey || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to enhance prompt');
      }

      setEnhancedResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!enhancedResult?.enhancedPrompt) return;
    navigator.clipboard.writeText(enhancedResult.enhancedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentCat = categories.find((c) => c.id === selectedCategory);

  const loadExample = () => {
    if (currentCat?.example) {
      setRawPrompt(currentCat.example);
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter to trigger enhance
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleEnhance();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex items-baseline space-x-1.5 sm:space-x-2">
              <span className="font-semibold tracking-tight text-white text-sm sm:text-base">PromptForge</span>
              <span className="text-[10px] sm:text-xs font-mono text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/60">
                Agent
              </span>
            </div>
          </div>

          {/* Model Status & Config button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {config && (
              <button
                onClick={() => setShowConfigModal(true)}
                className="group flex items-center space-x-1.5 sm:space-x-2 text-[11px] sm:text-xs bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-colors"
                title="View Model Configuration"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <span className="text-zinc-300 font-medium truncate max-w-[110px] sm:max-w-none">
                  {config.primary.name.replace('(Free)', '').trim()}
                </span>
                <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] uppercase font-mono">
                  FREE
                </span>
              </button>
            )}

            <button
              onClick={() => setShowConfigModal(true)}
              className="p-1.5 sm:p-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Settings"
              aria-label="Settings"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Category / Mode Pill Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-zinc-400">
              Select Mode / Category
            </label>
            {currentCat?.example && (
              <button
                type="button"
                onClick={loadExample}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center space-x-1"
              >
                <span>Try an example</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            )}
          </div>

          {/* Swipeable on mobile, wrapped on larger screens */}
          <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 pb-1.5 -mx-3 px-3 sm:mx-0 sm:px-0">
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-medium transition-all duration-150 flex items-center space-x-2 border whitespace-nowrap flex-shrink-0 sm:flex-shrink ${
                    active
                      ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500/60 shadow-sm shadow-indigo-500/10'
                      : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:bg-zinc-800/60 hover:text-zinc-200'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {currentCat && (
            <p className="text-[11px] sm:text-xs text-zinc-500 italic pt-0.5">
              {currentCat.description}
            </p>
          )}
        </div>

        {/* Dual Pane Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
          {/* Left: Input Pane */}
          <div className="flex flex-col bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
            <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-900/80">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
                <span className="text-xs font-medium text-zinc-300">Raw Input Prompt</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-zinc-500">
                <span>{rawPrompt.length} chars</span>
                {rawPrompt && (
                  <button
                    onClick={() => setRawPrompt('')}
                    className="hover:text-zinc-300 text-zinc-500 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 sm:p-4 flex-1">
              <textarea
                value={rawPrompt}
                onChange={(e) => setRawPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={9}
                placeholder="Enter your rough idea, simple instruction, or draft prompt here... (e.g. 'Cyberpunk ramen shop in Tokyo rain' or 'Microservice auth architecture with Next.js')"
                className="w-full bg-transparent resize-y outline-none text-zinc-200 placeholder-zinc-600 text-base sm:text-sm leading-relaxed min-h-[160px] sm:min-h-[220px]"
              />
            </div>

            <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-zinc-900/90 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-400">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-400">Enter</kbd>
              </span>

              <button
                type="button"
                onClick={handleEnhance}
                disabled={!rawPrompt.trim() || loading}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg text-sm sm:text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-600/20 transition-all duration-150"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Engineering with Nemotron...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Enhance Prompt</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Enhanced Output Pane */}
          <div className="flex flex-col bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm min-h-[300px] sm:min-h-[420px]">
            <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-900/80">
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${enhancedResult ? 'bg-indigo-400' : 'bg-zinc-600'}`} />
                <span className="text-xs font-medium text-zinc-300">Enhanced Prompt Output</span>
              </div>

              {enhancedResult && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1.5 px-2.5 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                  >
                    {copied ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4 flex-1 overflow-y-auto max-h-[550px]">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-start space-x-2">
                  <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="break-words">{errorMessage}</span>
                </div>
              )}

              {!errorMessage && !enhancedResult && !loading && (
                <div className="h-full min-h-[220px] sm:min-h-[300px] flex flex-col items-center justify-center text-center p-4 sm:p-6 text-zinc-600">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-2.5 sm:mb-3">
                    <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-zinc-400">Ready to engineer your prompt</p>
                  <p className="text-[11px] sm:text-xs text-zinc-500 mt-1 max-w-sm">
                    Select a category, enter your rough idea, and tap &ldquo;Enhance Prompt&rdquo;.
                  </p>
                </div>
              )}

              {loading && (
                <div className="h-full min-h-[220px] sm:min-h-[300px] flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-3">
                  <div className="w-9 h-9 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-xs text-zinc-400">Querying NVIDIA Nemotron 3.5 & structuring prompt...</p>
                </div>
              )}

              {enhancedResult && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="whitespace-pre-wrap font-mono text-xs sm:text-sm text-zinc-200 leading-relaxed bg-zinc-950/60 p-3 sm:p-4 rounded-lg border border-zinc-800/80 break-words selection:bg-indigo-500/30 overflow-x-auto">
                    {enhancedResult.enhancedPrompt}
                  </div>

                  {/* Provider Info Pill */}
                  <div className="p-2.5 sm:p-3 rounded-lg bg-zinc-900/70 border border-zinc-800 text-[11px] sm:text-xs flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-zinc-400">Model:</span>
                      <span className="font-semibold text-zinc-200">{enhancedResult.modelUsed}</span>
                    </div>

                    <button
                      onClick={() => setShowConfigModal(true)}
                      className="text-indigo-400 hover:text-indigo-300 underline font-mono text-[10px] sm:text-xs"
                    >
                      Config
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-4 mt-6 text-center text-[11px] sm:text-xs text-zinc-500 px-4">
        <p>PromptForge &middot; Powered by NVIDIA Nemotron &middot; <span className="font-mono">promt.zyqwax.com</span></p>
      </footer>

      {/* Model & Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <h3 className="text-sm sm:text-base font-semibold text-white">Model Configuration</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-zinc-400 hover:text-zinc-200 text-xl leading-none p-1"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <p className="text-zinc-400 leading-relaxed">
                The agent is configured in <code className="text-indigo-300 font-mono">src/config/ai.config.ts</code> to use NVIDIA Nemotron 3.5 (Free) via OpenRouter without any paid models or token caps.
              </p>

              {config && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px] sm:text-[11px]">Active AI Model</span>
                  <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white">{config.primary.name}</span>
                        <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 px-1.5 py-0.5 rounded font-mono">
                          FREE
                        </span>
                      </div>
                      <span className="text-zinc-500 text-[11px] font-mono break-all">{config.primary.id}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded flex-shrink-0 ${config.primary.isConfigured ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' : 'bg-zinc-800 text-zinc-500'}`}>
                      {config.primary.isConfigured ? 'Key Configured' : 'Missing Key'}
                    </span>
                  </div>
                </div>
              )}

              {/* Quick API Key Override */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                <label className="text-zinc-300 font-medium">OpenRouter API Key</label>
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => handleSaveCustomKey(e.target.value)}
                  placeholder="Paste your OpenRouter key (sk-or-v1-...)"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 outline-none focus:border-indigo-500 font-mono text-xs"
                />
                <p className="text-[11px] text-zinc-500">
                  Key can also be set in <code className="text-zinc-400 font-mono">.env.local</code> as <code className="text-zinc-400 font-mono">OPENROUTER_API_KEY</code>.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowConfigModal(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
