import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { PlaceDetails } from "@/types/booking";

interface PlacesAutocompleteProps {
  placeholder: string;
  value: string;
  onPlaceSelect: (place: PlaceDetails) => void;
  onInputChange: (value: string) => void;
}

export function PlacesAutocomplete({
  placeholder,
  value,
  onPlaceSelect,
  onInputChange,
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps is loaded
    const checkGoogleMaps = () => {
      if (window.google?.maps?.places) {
        setIsLoaded(true);
        return true;
      }
      return false;
    };

    if (checkGoogleMaps()) return;

    // Poll for Google Maps to load
    const interval = setInterval(() => {
      if (checkGoogleMaps()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "in" },
      fields: ["formatted_address", "place_id", "geometry"],
      types: ["geocode", "establishment"],
    });

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      if (place?.geometry?.location && place.place_id) {
        onPlaceSelect({
          address: place.formatted_address || "",
          placeId: place.place_id,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }
    });
  }, [isLoaded, onPlaceSelect]);

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onInputChange(e.target.value)}
        className="pl-10 bg-input border-border/50 text-foreground placeholder:text-muted-foreground focus:border-accent"
      />
    </div>
  );
}
