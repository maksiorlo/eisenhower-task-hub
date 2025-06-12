
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

interface TimeInputProps {
  value?: string;
  onChange: (value: string) => void;
  onFinish?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function TimeInput({ value = '', onChange, onFinish, placeholder = 'ЧЧ:ММ', className, autoFocus }: TimeInputProps) {
  const [displayValue, setDisplayValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayValue(value || '');
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const validateTime = (timeStr: string) => {
    if (!timeStr || !timeStr.includes(':')) return false;
    
    const [hours, minutes] = timeStr.split(':');
    if (hours.length !== 2 || minutes.length !== 2) return false;
    
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  };

  const formatTime = (input: string, cursorPosition: number = 0) => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '');
    
    if (digits.length === 0) return '';
    
    let formatted = '';
    if (digits.length >= 1) {
      formatted += digits[0];
    }
    if (digits.length >= 2) {
      formatted += digits[1] + ':';
    }
    if (digits.length >= 3) {
      formatted += digits[2];
    }
    if (digits.length >= 4) {
      formatted += digits[3];
    }
    
    return formatted;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    
    // Allow deletion
    if (newValue.length < displayValue.length) {
      setDisplayValue(newValue);
      if (newValue === '') {
        onChange('');
      }
      return;
    }
    
    // Only allow digits and colon
    if (!/^[\d:]*$/.test(newValue)) {
      return;
    }
    
    const formatted = formatTime(newValue, cursorPosition);
    
    // Don't allow more than 5 characters (HH:MM)
    if (formatted.length > 5) {
      return;
    }
    
    setDisplayValue(formatted);
    
    // Only save if it's a complete valid time or empty
    if (formatted === '' || validateTime(formatted)) {
      onChange(formatted);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Only finish if time is complete and valid or empty
      if (displayValue === '' || validateTime(displayValue)) {
        onFinish?.();
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setDisplayValue(value || '');
      onFinish?.();
    }
    
    // Handle backspace to remove colon properly
    if (e.key === 'Backspace') {
      const cursorPosition = (e.target as HTMLInputElement).selectionStart || 0;
      if (cursorPosition === 3 && displayValue[2] === ':') {
        e.preventDefault();
        const newValue = displayValue.slice(0, 2);
        setDisplayValue(newValue);
        if (newValue === '') {
          onChange('');
        }
      }
    }
  };

  const handleBlur = () => {
    // Reset to original value if invalid
    if (displayValue !== '' && !validateTime(displayValue)) {
      setDisplayValue(value || '');
    }
    onFinish?.();
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      maxLength={5}
      style={{ direction: 'ltr' }}
    />
  );
}
