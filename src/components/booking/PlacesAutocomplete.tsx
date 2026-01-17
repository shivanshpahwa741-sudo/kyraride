import { useRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import type { PlaceDetails } from "@/types/booking";
import { extractPlaceDetails } from "@/lib/google-maps";

interface PlacesAutocompleteProps {
  placeholder: string;
  value: string;
  onPlaceSelect: (place: PlaceDetails) => void;
  onInputChange: (value: string) => void;
  disabled?: boolean;
}

export function PlacesAutocomplete({
  placeholder,
  value,
  onPlaceSelect,
  onInputChange,
  disabled = false,
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;

    // Initialize autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "in" },
      fields: ["formatted_address", "place_id", "geometry", "name"],
      types: ["geocode", "establishment"],
    });

    // Add listener for place selection
    const listener = autocompleteRef.current.addListener("place_changed", () => {
      setIsLoading(true);
      const place = autocompleteRef.current?.getPlace();

      if (place) {
        const details = extractPlaceDetails(place);
        if (details) {
          onPlaceSelect(details);
          onInputChange(details.address);
        }
      }
      setIsLoading(false);
    });

    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [onPlaceSelect, onInputChange]);

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onInputChange(e.target.value)}
        disabled={disabled}
        className="pl-10 pr-10 bg-input border-border/50 text-foreground placeholder:text-muted-foreground focus:border-accent"
      />
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
