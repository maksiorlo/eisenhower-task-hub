
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

  const formatTime = (input: string) => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '');
    
    if (digits.length === 0) return '';
    if (digits.length === 1) return `0${digits}:`;
    if (digits.length === 2) return `${digits}:`;
    if (digits.length === 3) return `${digits.slice(0, 2)}:${digits.slice(2, 3)}`;
    if (digits.length >= 4) {
      const hours = digits.slice(0, 2);
      const minutes = digits.slice(2, 4);
      return `${hours}:${minutes}`;
    }
    
    return digits;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Allow deletion
    if (newValue.length < displayValue.length) {
      setDisplayValue(newValue);
      if (newValue === '') {
        onChange('');
      }
      return;
    }
    
    const formatted = formatTime(newValue);
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
    />
  );
}
