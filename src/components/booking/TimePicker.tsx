import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse current value
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hour: 9, minute: 0, period: "AM" as const };
    
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    
    return { hour: hour12, minute: minutes, period };
  };

  const { hour, minute, period } = parseTime(value);

  // Format display time
  const formatDisplayTime = () => {
    if (!value) return "Select time";
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  // Update time value
  const updateTime = (newHour: number, newMinute: number, newPeriod: "AM" | "PM") => {
    let hour24 = newHour;
    if (newPeriod === "PM" && newHour !== 12) {
      hour24 = newHour + 12;
    } else if (newPeriod === "AM" && newHour === 12) {
      hour24 = 0;
    }
    const timeStr = `${hour24.toString().padStart(2, "0")}:${newMinute.toString().padStart(2, "0")}`;
    onChange(timeStr);
  };

  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center rounded-md border border-border/50 bg-input px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-3 h-5 w-5 text-muted-foreground" />
          <span className={cn("flex-1 text-left", value ? "text-foreground" : "text-muted-foreground")}>
            {formatDisplayTime()}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[280px] p-0 bg-popover border border-border shadow-lg z-50" 
        align="start"
        sideOffset={4}
      >
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="text-center pb-2 border-b border-border/30">
            <p className="text-sm font-medium text-foreground">Select Pickup Time</p>
            <p className="text-lg font-bold text-accent mt-1">{formatDisplayTime()}</p>
          </div>

          {/* Hour Selection */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hour</p>
            <div className="grid grid-cols-6 gap-1">
              {hours.map((h) => (
                <Button
                  key={h}
                  type="button"
                  variant={hour === h ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-8 w-full text-xs",
                    hour === h 
                      ? "bg-accent text-accent-foreground hover:bg-accent/90" 
                      : "hover:bg-accent/10"
                  )}
                  onClick={() => updateTime(h, minute, period as "AM" | "PM")}
                >
                  {h}
                </Button>
              ))}
            </div>
          </div>

          {/* Minute Selection */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Minute</p>
            <div className="grid grid-cols-6 gap-1">
              {minutes.map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant={minute === m ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-8 w-full text-xs",
                    minute === m 
                      ? "bg-accent text-accent-foreground hover:bg-accent/90" 
                      : "hover:bg-accent/10"
                  )}
                  onClick={() => updateTime(hour, m, period as "AM" | "PM")}
                >
                  {m.toString().padStart(2, "0")}
                </Button>
              ))}
            </div>
          </div>

          {/* AM/PM Selection */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Period</p>
            <div className="grid grid-cols-2 gap-2">
              {(["AM", "PM"] as const).map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={period === p ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-10",
                    period === p 
                      ? "bg-accent text-accent-foreground hover:bg-accent/90" 
                      : "hover:bg-accent/10"
                  )}
                  onClick={() => updateTime(hour, minute, p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>

          {/* Done Button */}
          <Button
            type="button"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={() => setIsOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
