
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export function CustomDropdown({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  className = "",
  triggerClassName = "",
  contentClassName = ""
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const selectedOption = options.find(option => option.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev => {
            const next = prev < options.length - 1 ? prev + 1 : 0;
            scrollToOption(next);
            return next;
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev => {
            const next = prev > 0 ? prev - 1 : options.length - 1;
            scrollToOption(next);
            return next;
          });
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && !options[highlightedIndex].disabled) {
            onValueChange(options[highlightedIndex].value);
            setIsOpen(false);
            setHighlightedIndex(-1);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, options, onValueChange]);

  const scrollToOption = (index: number) => {
    const option = optionRefs.current[index];
    const content = contentRef.current;
    if (option && content) {
      const optionTop = option.offsetTop;
      const optionHeight = option.offsetHeight;
      const contentScrollTop = content.scrollTop;
      const contentHeight = content.offsetHeight;

      if (optionTop < contentScrollTop) {
        content.scrollTo({ top: optionTop, behavior: 'smooth' });
      } else if (optionTop + optionHeight > contentScrollTop + contentHeight) {
        content.scrollTo({ top: optionTop + optionHeight - contentHeight, behavior: 'smooth' });
      }
    }
  };

  const handleOptionClick = (option: DropdownOption) => {
    if (!option.disabled) {
      onValueChange(option.value);
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between px-3 py-2 text-left
          bg-[#222222] border border-[#7C5DFA]/30 rounded-md
          text-white placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-[#7C5DFA]/50 focus:border-[#7C5DFA]
          hover:border-[#7C5DFA]/50 transition-all duration-200
          ${triggerClassName}
        `}
      >
        <span className={selectedOption ? "text-white" : "text-gray-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1">
          <div 
            ref={contentRef}
            className={`
              bg-[#1E1E1E] border border-[#7C5DFA]/20 rounded-md shadow-2xl
              max-h-80 overflow-y-auto smooth-scroll-dropdown
              ${contentClassName}
            `}
          >
            {options.map((option, index) => (
              <div
                key={option.value}
                ref={el => optionRefs.current[index] = el}
                onClick={() => handleOptionClick(option)}
                className={`
                  qsai-dropdown-option px-3 py-3 cursor-pointer transition-all duration-200
                  ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800/50'}
                  ${highlightedIndex === index ? 'bg-gray-800/70' : ''}
                  ${value === option.value ? 'bg-gray-700/50' : ''}
                  ${option.className || ''}
                `}
                data-highlighted={highlightedIndex === index ? "true" : "false"}
                data-selected={value === option.value ? "true" : "false"}
                style={{
                  backgroundColor: highlightedIndex === index 
                    ? '#1E1E1E !important' 
                    : value === option.value 
                    ? '#1E1E1E !important' 
                    : '#1E1E1E !important',
                  borderLeftColor: (highlightedIndex === index || value === option.value)
                    ? '#7C5DFA !important' 
                    : 'transparent !important',
                  borderLeftWidth: '2px',
                  borderLeftStyle: 'solid'
                }}
              >
                <div className="text-white font-medium">{option.label}</div>
                {option.description && (
                  <div className="text-gray-400 text-sm mt-1">{option.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
