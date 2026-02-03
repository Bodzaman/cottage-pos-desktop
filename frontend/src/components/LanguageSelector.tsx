/**
 * LanguageSelector - Language switcher for POS interface
 *
 * Displays current language with flag and allows switching between supported languages.
 * Designed to fit into the POS header/navigation area.
 */

import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguageStore } from '../utils/languageStore';
import { SUPPORTED_LANGUAGES, type LanguageConfig } from '../utils/i18nConfig';
import { QSAITheme } from '../utils/QSAIDesign';

interface LanguageSelectorProps {
  /** Compact mode shows only flag, full mode shows flag + name */
  variant?: 'compact' | 'full';
  /** Optional className for additional styling */
  className?: string;
  /** Direction dropdown opens - 'down' for header, 'up' for footer placement */
  dropdownDirection?: 'up' | 'down';
}

export function LanguageSelector({ variant = 'full', className = '', dropdownDirection = 'down' }: LanguageSelectorProps) {
  const { t } = useTranslation('common');
  const { currentLanguage, setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangConfig = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLanguageSelect = (lang: LanguageConfig) => {
    setLanguage(lang.code);
    setIsOpen(false);
  };

  const unifiedGradient = `linear-gradient(135deg, #5B21B6 30%, #7C3AED 100%)`;
  const purpleGlow = `rgba(146, 119, 255, 0.4)`;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200"
        style={{
          background: isOpen
            ? `linear-gradient(145deg, rgba(28, 28, 28, 0.95) 0%, rgba(35, 35, 35, 0.95) 100%)`
            : `linear-gradient(145deg, rgba(18, 18, 18, 0.9) 0%, rgba(26, 26, 26, 0.9) 100%)`,
          borderColor: isOpen ? 'rgba(146, 119, 255, 0.4)' : 'rgba(255, 255, 255, 0.08)',
          color: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          boxShadow: isOpen
            ? `0 4px 12px rgba(0, 0, 0, 0.3), 0 0 8px ${purpleGlow}`
            : '0 2px 6px rgba(0, 0, 0, 0.2)',
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label={t('labels.selectLanguage')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {/* Flag or Globe icon */}
        <span className="text-lg" role="img" aria-label={currentLangConfig?.name}>
          {currentLangConfig?.flag || <Globe className="h-4 w-4" />}
        </span>

        {/* Language name (full mode only) */}
        {variant === 'full' && (
          <span className="text-sm font-medium truncate max-w-[100px]">
            {currentLangConfig?.nativeName || currentLangConfig?.name || 'English'}
          </span>
        )}

        {/* Chevron */}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </motion.span>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: dropdownDirection === 'up' ? 8 : -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropdownDirection === 'up' ? 8 : -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute right-0 w-56 rounded-xl overflow-hidden z-50 ${
              dropdownDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
            style={{
              background: `linear-gradient(145deg, ${QSAITheme.background.secondary} 0%, ${QSAITheme.background.tertiary} 100%)`,
              border: '1px solid rgba(146, 119, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 16px rgba(146, 119, 255, 0.15)',
              backdropFilter: 'blur(16px)',
            }}
            role="listbox"
            aria-label={t('labels.selectLanguage')}
          >
            {/* Header */}
            <div
              className="px-3 py-2 border-b text-xs font-medium uppercase tracking-wider"
              style={{
                borderColor: 'rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              {t('labels.language')}
            </div>

            {/* Language Options */}
            <div className="py-1 max-h-64 overflow-y-auto">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === currentLanguage;
                return (
                  <motion.button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                    style={{
                      background: isSelected
                        ? 'rgba(146, 119, 255, 0.15)'
                        : 'transparent',
                      color: isSelected
                        ? 'rgba(255, 255, 255, 1)'
                        : 'rgba(255, 255, 255, 0.8)',
                    }}
                    whileHover={{
                      backgroundColor: isSelected
                        ? 'rgba(146, 119, 255, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)',
                    }}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {/* Flag */}
                    <span className="text-xl flex-shrink-0" role="img" aria-hidden>
                      {lang.flag}
                    </span>

                    {/* Names */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {lang.nativeName}
                      </div>
                      <div
                        className="text-xs truncate"
                        style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                      >
                        {lang.name}
                      </div>
                    </div>

                    {/* Selected checkmark */}
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0"
                        style={{ color: '#9277FF' }}
                      >
                        <Check className="h-4 w-4" />
                      </motion.span>
                    )}

                    {/* RTL indicator */}
                    {lang.rtl && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          background: 'rgba(146, 119, 255, 0.2)',
                          color: 'rgba(146, 119, 255, 0.9)',
                        }}
                      >
                        RTL
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LanguageSelector;
