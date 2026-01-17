import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { WeekDay } from "@/types/booking";

interface DaySelectorProps {
  selectedDays: WeekDay[];
  onDaysChange: (days: WeekDay[]) => void;
}

const DAYS: { value: WeekDay; label: string; short: string }[] = [
  { value: "monday", label: "Monday", short: "Mon" },
  { value: "tuesday", label: "Tuesday", short: "Tue" },
  { value: "wednesday", label: "Wednesday", short: "Wed" },
  { value: "thursday", label: "Thursday", short: "Thu" },
  { value: "friday", label: "Friday", short: "Fri" },
  { value: "saturday", label: "Saturday", short: "Sat" },
  { value: "sunday", label: "Sunday", short: "Sun" },
];

export function DaySelector({ selectedDays, onDaysChange }: DaySelectorProps) {
  const toggleDay = (day: WeekDay) => {
    if (selectedDays.includes(day)) {
      onDaysChange(selectedDays.filter((d) => d !== day));
    } else {
      onDaysChange([...selectedDays, day]);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">
        Select days for your weekly commute
      </Label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {DAYS.map((day) => (
          <label
            key={day.value}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              selectedDays.includes(day.value)
                ? "border-accent bg-accent/10"
                : "border-border/50 hover:border-accent/50"
            }`}
          >
            <Checkbox
              checked={selectedDays.includes(day.value)}
              onCheckedChange={() => toggleDay(day.value)}
              className="border-border data-[state=checked]:bg-accent data-[state=checked]:border-accent"
            />
            <span className="text-sm text-foreground">
              <span className="hidden sm:inline">{day.label}</span>
              <span className="sm:hidden">{day.short}</span>
            </span>
          </label>
        ))}
      </div>
      {selectedDays.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedDays.length} {selectedDays.length === 1 ? "day" : "days"} selected
        </p>
      )}
    </div>
  );
}
