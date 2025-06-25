import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

interface DatePickerWithCurrentProps {
  value: string;
  onChange: (date: string) => void;
  isCurrent: boolean;
  onCurrentChange: (current: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const DatePickerWithCurrent: React.FC<DatePickerWithCurrentProps> = ({
  value,
  onChange,
  isCurrent,
  onCurrentChange,
  placeholder = "Wybierz datę",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
      setIsOpen(false);
    }
  };

  const handleCurrentToggle = () => {
    const newCurrentState = !isCurrent;
    onCurrentChange(newCurrentState);
    if (newCurrentState) {
      onChange(''); 
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal h-12 rounded-sm ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${!value && !isCurrent ? 'text-gray-500' : ''}`}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {isCurrent 
            ? "Obecnie" 
            : value 
              ? formatDisplayDate(value) 
              : placeholder
          }
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none font-poppins" align="start">
        <div className="border-b p-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="current-checkbox"
              checked={isCurrent}
              onChange={handleCurrentToggle}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="current-checkbox" className="text-sm font-medium text-gray-700">
              Present
            </label>
          </div>
        </div>
        {!isCurrent && (
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={handleDateSelect}
            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
            initialFocus
          />
        )}
      </PopoverContent>
    </Popover>
  );
};