import React from 'react';

interface ToggleCallPutProps {
  value: boolean;                 // true = "Call", false = "Put"
  onChange: (newValue: boolean) => void;
}

const ToggleCallPut: React.FC<ToggleCallPutProps> = ({ value, onChange }) => {
  // A click on the entire component inverts the boolean
  const handleToggle = () => onChange(!value);

  return (
    <div 
      className="flex w-full rounded-full bg-neutral p-1 cursor-pointer select-none"
      onClick={handleToggle}
    >
      {/* "Call" side */}
      <div
        className={`flex-1 text-center rounded-full py-1 transition-colors ${
          value
            ? 'bg-primary text-white'
            : 'text-gray-700'
        }`}
      >
        Call option
      </div>

      {/* "Put" side */}
      <div
        className={`flex-1 text-center rounded-full py-1 transition-colors ${
          !value
            ? 'bg-primary text-white'
            : 'text-gray-700'
        }`}
      >
        Put option
      </div>
    </div>
  );
};

export default ToggleCallPut;
