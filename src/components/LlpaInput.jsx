/**
 * LLPA Input Component
 * Handles numeric values and NA/NULL input for LLPA grid cells
 */

import { useState, useEffect, useRef } from 'react';

export function LlpaInput({ value, onChange, disabled = false }) {
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  // Sync input value with prop
  useEffect(() => {
    if (value === null) {
      setInputValue('N/A');
    } else {
      setInputValue(value?.toString() || '0');
    }
  }, [value]);

  // Handle input change
  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
  };

  // Handle blur - parse and validate value
  const handleBlur = () => {
    setIsEditing(false);

    const trimmed = inputValue.trim().toUpperCase();

    // Check for NA/NULL values
    if (trimmed === 'NA' || trimmed === 'N/A' || trimmed === 'NULL' || trimmed === '-') {
      onChange(null);
      return;
    }

    // Try to parse as number
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
    } else if (inputValue.trim() === '') {
      onChange(0);
    }
  };

  // Handle key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
    if (e.key === 'Escape') {
      // Reset to original value
      if (value === null) {
        setInputValue('N/A');
      } else {
        setInputValue(value?.toString() || '0');
      }
      e.target.blur();
    }
  };

  // Handle focus
  const handleFocus = () => {
    setIsEditing(true);
    // Select all text on focus
    if (inputRef.current) {
      inputRef.current.select();
    }
  };

  // Determine if current value is null/NA
  const isNull = value === null;

  // Determine styling based on value
  const getInputStyle = () => {
    if (isNull) {
      return 'bg-[#18181B] border-[#27272A] text-[#71717A] hover:bg-[#27272A]';
    }
    if (value > 0) {
      return 'bg-[#DCFCE7] border-[#86EFAC] text-[#166534]';
    }
    if (value < 0) {
      return 'bg-[#FEE2E2] border-[#FECACA] text-[#991B1B]';
    }
    return 'bg-white border-[#E4E4E7] text-[#71717A]';
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={isEditing ? inputValue : (isNull ? 'N/A' : (value || 0))}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      placeholder="0"
      className={`
        w-full h-8 px-1 text-center text-sm font-mono rounded border transition-colors
        ${getInputStyle()}
        focus:outline-none focus:ring-2 focus:ring-[#007FFF] focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      title={isNull ? 'Type a number to enable, or keep N/A' : 'Enter value or type NA/NULL to disable'}
    />
  );
}

export default LlpaInput;
