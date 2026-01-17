import { Label } from "@/components/ui/label";
import type { WeekDay } from "@/types/booking";

interface DaySelectorProps {
  selectedDays: WeekDay[];
  onDaysChange: (days: WeekDay[]) => void;
  disabled?: boolean;
}

const DAYS: { value: WeekDay; label: string; shortLabel: string }[] = [
  { value: "monday", label: "Monday", shortLabel: "Mon" },
  { value: "tuesday", label: "Tuesday", shortLabel: "Tue" },
  { value: "wednesday", label: "Wednesday", shortLabel: "Wed" },
  { value: "thursday", label: "Thursday", shortLabel: "Thu" },
  { value: "friday", label: "Friday", shortLabel: "Fri" },
  { value: "saturday", label: "Saturday", shortLabel: "Sat" },
  { value: "sunday", label: "Sunday", shortLabel: "Sun" },
];

export function DaySelector({
  selectedDays,
  onDaysChange,
  disabled = false,
}: DaySelectorProps) {
  const toggleDay = (day: WeekDay) => {
    if (selectedDays.includes(day)) {
      onDaysChange(selectedDays.filter((d) => d !== day));
    } else {
      onDaysChange([...selectedDays, day]);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-foreground font-medium">Select Days</Label>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {DAYS.map((day) => (
          <button
            key={day.value}
            type="button"
            onClick={() => !disabled && toggleDay(day.value)}
            disabled={disabled}
            className={`
              flex items-center justify-center p-3 rounded-lg border transition-all font-medium text-sm
              ${
                selectedDays.includes(day.value)
                  ? "bg-[hsl(351,55%,12%)] border-accent text-[hsl(32,35%,87%)]"
                  : "bg-input border-border/50 text-muted-foreground hover:border-accent/50"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            <span className="hidden sm:inline">{day.shortLabel}</span>
            <span className="sm:hidden">{day.shortLabel.charAt(0)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
