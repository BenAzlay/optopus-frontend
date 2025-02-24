import { FC } from "react";

interface NumberFieldProps {
  value: string;
  onChangeValue: (value: string) => void;
  error?: string | null;
}

const NumberField: FC<NumberFieldProps> = ({
  value,
  onChangeValue,
  error = null,
}) => {
  const handleInputChange = (value: string) => {
    // Allow only digits (no decimal points)
    if (/^\d*$/.test(value)) {
      onChangeValue(value);
    }
  };

  return (
    <div
      title={error ? error : undefined}
      className={`rounded-md bg-[#1e1e1e] px-2 sm:px-4 py-3 w-full border ${
        !!error ? "border-error" : "border-[#333333]"
      }`}
    >
      <input
        value={value}
        onChange={(event) => handleInputChange(event.target.value)}
        type="text"
        placeholder={"42"}
        className="bg-transparent w-full text-white text-lg placeholder-gray-500 focus:outline-none"
      />
    </div>
  );
};

export default NumberField;
