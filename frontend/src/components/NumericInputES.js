import React, { useState, useEffect } from 'react';

/**
 * Input numérico con formato español visible (puntos de miles).
 * Muestra "1.250.000" mientras se ve, guarda 1250000 internamente.
 */
export const NumericInputES = ({ value, onChange, placeholder, className, testId, ...props }) => {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    if (value === '' || value === null || value === undefined) {
      setDisplay('');
    } else {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (!isNaN(num)) {
        setDisplay(num.toLocaleString('es-ES'));
      }
    }
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value;
    // Allow only digits, dots (thousands separator), commas (decimal)
    const cleaned = raw.replace(/[^\d.,]/g, '');
    setDisplay(cleaned);

    // Parse to number: remove dots (thousands), replace comma with period (decimal)
    const numStr = cleaned.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(numStr);
    if (!isNaN(num)) {
      onChange(num);
    } else if (cleaned === '') {
      onChange('');
    }
  };

  const handleBlur = () => {
    // Reformat on blur
    if (value !== '' && value !== null && value !== undefined) {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (!isNaN(num)) {
        setDisplay(num.toLocaleString('es-ES'));
      }
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className || 'input-arroba w-full'}
      data-testid={testId}
      {...props}
    />
  );
};
