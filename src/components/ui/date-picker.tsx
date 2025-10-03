import * as React from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
}

export function DatePicker({ value, onChange, placeholder = "Select date" }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [manualInput, setManualInput] = React.useState(value || "");
  const [selectedYear, setSelectedYear] = React.useState<string>(
    value ? new Date(value.split('/').reverse().join('-')).getFullYear().toString() : new Date().getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = React.useState<string>(
    value ? (new Date(value.split('/').reverse().join('-')).getMonth()).toString() : new Date().getMonth().toString()
  );
  const [selectedDay, setSelectedDay] = React.useState<string>(
    value ? new Date(value.split('/').reverse().join('-')).getDate().toString() : ""
  );

  React.useEffect(() => {
    setManualInput(value || "");
  }, [value]);

  // Generate years (1950 to current year)
  const currentYear = new Date().getFullYear();
  const years = React.useMemo(() => 
    Array.from({ length: currentYear - 1949 }, (_, i) => (currentYear - i).toString()),
    [currentYear]
  );

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const days = React.useMemo(() => {
    const daysCount = getDaysInMonth(parseInt(selectedYear), parseInt(selectedMonth));
    return Array.from({ length: daysCount }, (_, i) => (i + 1).toString());
  }, [selectedYear, selectedMonth]);

  const handleApply = () => {
    if (selectedDay && selectedMonth && selectedYear) {
      const formattedDate = `${selectedDay.padStart(2, '0')}/${(parseInt(selectedMonth) + 1).toString().padStart(2, '0')}/${selectedYear}`;
      onChange?.(formattedDate);
      setManualInput(formattedDate);
      setOpen(false);
    }
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/[^\d/]/g, ''); // Only allow digits and /
    
    // Remove existing slashes to reformat
    const digitsOnly = input.replace(/\//g, '');
    
    // Auto-format with slashes
    if (digitsOnly.length >= 2) {
      input = digitsOnly.slice(0, 2);
      if (digitsOnly.length >= 4) {
        input += '/' + digitsOnly.slice(2, 4) + '/' + digitsOnly.slice(4, 8);
      } else if (digitsOnly.length > 2) {
        input += '/' + digitsOnly.slice(2);
      }
    } else {
      input = digitsOnly;
    }
    
    setManualInput(input);
    
    // Only call onChange if the date is complete or empty
    if (input.length === 10 || input.length === 0) {
      onChange?.(input);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        placeholder="DD/MM/YYYY"
        value={manualInput}
        onChange={handleManualChange}
        maxLength={10}
        className="flex-1"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="end">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <label className="text-xs font-medium">Day</label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger>
                    <SelectValue placeholder="DD" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {days.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Month</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {months.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Year</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="YYYY" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleApply} className="w-full" size="sm">
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
