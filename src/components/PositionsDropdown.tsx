import { FC, useState, useEffect, useRef } from "react";
import { abbreviateAmount, compareEthereumAddresses } from "@/utils/utilFunc";
import Position from "@/app/types/Position";

interface PositionsDropdownProps {
  positions: Position[];
  selectedPosition: Position | null;
  onSelectPosition: (position: Position) => void;
}

const PositionsDropdown: FC<PositionsDropdownProps> = ({
  positions,
  selectedPosition,
  onSelectPosition,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const positionItem = (position: Position | null) => {
    if (position === null) return null;
    return (
      <span className="inline-flex gap-2 items-center w-full font-bold p-2">
        {position.token0.symbol} {abbreviateAmount(position.amount0, "", 3)} +{" "}
        {position.token1.symbol} {abbreviateAmount(position.amount1, "", 3)}
      </span>
    );
  };

  return (
    <div ref={dropdownRef} className="relative inline-block w-full">
      <button
        className="flex items-center justify-end w-full gap-2 p-2 text-sm font-medium text-white bg-[#1e1e1e] border border-[#333333] rounded-lg shadow-md hover:bg-[#2a2a2a]"
        onClick={(event) => {
          event.preventDefault();
          toggleDropdown();
        }}
        aria-expanded={isOpen}
        aria-controls="positions-dropdown"
      >
        {positionItem(selectedPosition)}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={`w-5 h-5 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>
      {isOpen && (
        <ul
          id="positions-dropdown"
          className="absolute z-10 w-full mt-2 bg-[#1e1e1e] border border-[#333333] rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {positions.map((position, index) => (
            <li
              key={index}
              onClick={() => {
                onSelectPosition(position);
                setIsOpen(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm text-white cursor-pointer hover:bg-[#2a2a2a] ${
                compareEthereumAddresses(
                  selectedPosition?.tokenId,
                  position.tokenId
                )
                  ? "bg-[#2a2a2a]"
                  : ""
              }`}
            >
              {positionItem(position)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PositionsDropdown;
