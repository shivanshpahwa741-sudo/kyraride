import { useEffect, useRef, useState } from "react";
import { Loader2, Navigation } from "lucide-react";

interface RouteMapProps {
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  pickupAddress: string;
  dropAddress: string;
}

export function RouteMap({
  pickupLat,
  pickupLng,
  dropLat,
  dropLng,
  pickupAddress,
  dropAddress,
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) {
      setIsLoading(false);
      setError("Maps not available");
      return;
    }

    const mapInstance = new google.maps.Map(mapRef.current, {
      zoom: 12,
      center: { lat: pickupLat, lng: pickupLng },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        // Dark burgundy theme to match the app
        { elementType: "geometry", stylers: [{ color: "#1a0a0d" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1a0a0d" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#b39985" }] },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#38181d" }],
        },
        {
          featureType: "road",
          elementType: "geometry.stroke",
          stylers: [{ color: "#4a2228" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [{ color: "#4a2228" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#0e1626" }],
        },
        {
          featureType: "poi",
          elementType: "geometry",
          stylers: [{ color: "#2a1215" }],
        },
      ],
    });

    const renderer = new google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: "#E8D8C4",
        strokeWeight: 4,
        strokeOpacity: 0.9,
      },
      markerOptions: {
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#E8D8C4",
          fillOpacity: 1,
          strokeColor: "#561C24",
          strokeWeight: 2,
        },
      },
    });

    renderer.setMap(mapInstance);
    setMap(mapInstance);
    setDirectionsRenderer(renderer);
  }, [pickupLat, pickupLng]);

  // Calculate and display route
  useEffect(() => {
    if (!map || !directionsRenderer || !window.google?.maps) return;

    setIsLoading(true);
    setError(null);

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: { lat: pickupLat, lng: pickupLng },
        destination: { lat: dropLat, lng: dropLng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        setIsLoading(false);

        if (status === "OK" && result) {
          directionsRenderer.setDirections(result);

          // Extract route info
          const leg = result.routes[0]?.legs[0];
          if (leg) {
            setRouteInfo({
              distance: leg.distance?.text || "",
              duration: leg.duration?.text || "",
            });
          }
        } else {
          setError("Could not calculate route");
        }
      }
    );
  }, [map, directionsRenderer, pickupLat, pickupLng, dropLat, dropLng]);

  if (error) {
    return (
      <div className="rounded-xl border border-border/30 bg-card/50 p-6">
        <p className="text-center text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-border/30">
        <div
          ref={mapRef}
          className="w-full h-[250px] md:h-[300px]"
        />

        {isLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        )}
      </div>

      {/* Route Info */}
      {routeInfo && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/30">
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="h-4 w-4 text-accent" />
            <span className="text-muted-foreground">Estimated route:</span>
          </div>
          <div className="text-sm font-medium text-foreground">
            {routeInfo.distance} • {routeInfo.duration}
          </div>
        </div>
      )}

      {/* Location Labels */}
      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <span className="w-2 h-2 mt-1 rounded-full bg-green-500 shrink-0" />
          <span className="line-clamp-1">{pickupAddress}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="w-2 h-2 mt-1 rounded-full bg-red-500 shrink-0" />
          <span className="line-clamp-1">{dropAddress}</span>
        </div>
      </div>
    </div>
  );
}
