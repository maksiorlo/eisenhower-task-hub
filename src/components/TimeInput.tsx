
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface TimeInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TimeInput({ value = '', onChange, placeholder = 'HH:MM', className }: TimeInputProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const formatTime = (input: string) => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '');
    
    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;
    if (digits.length === 3) return `${digits[0]}${digits[1]}:${digits[2]}`;
    if (digits.length >= 4) {
      const hours = digits.slice(0, 2);
      const minutes = digits.slice(2, 4);
      return `${hours}:${minutes}`;
    }
    
    return digits;
  };

  const validateTime = (timeStr: string) => {
    if (!timeStr || !timeStr.includes(':')) return false;
    
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTime(e.target.value);
    setDisplayValue(formatted);
    
    // Only call onChange if it's a valid time or empty
    if (formatted === '' || validateTime(formatted)) {
      onChange(formatted);
    }
  };

  return (
    <Input
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      maxLength={5}
    />
  );
}
