import { useState, useRef, useEffect } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";

interface Props {
  isEditing: boolean;
  address: string;
  onAddressChange(addr: string): void;
  marker: { lat: number; lng: number };
  onMarkerChange(lat: number, lng: number): void;
}

const mapContainerStyle = { width: "100%", height: "300px" };
const MAPS_LIBRARIES: ("places")[] = ["places"];
const DEFAULT_CENTER = { lat: 25.2048, lng: 55.2708 };

function getClientMapsApiKey() {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
}

export default function MapSection(props: Props) {
  const apiKey = getClientMapsApiKey();
  
  if (!apiKey) {
    return (
      <>
        <div className="flex items-center rounded-lg px-4 py-3 border border-gray-300">
          <input
            type="text"
            value={props.address}
            onChange={(e) =>
              props.isEditing && props.onAddressChange(e.target.value)
            }
            placeholder="Enter Location Address"
            readOnly={!props.isEditing}
            className={`w-full min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-500 outline-none ${
              !props.isEditing ? "cursor-not-allowed" : ""
            }`}
          />
        </div>
      </>
    );
  }
  
  return <LoadedMap apiKey={apiKey} {...props} />;
}

function LoadedMap({
  apiKey,
  isEditing,
  address,
  onAddressChange,
  marker,
  onMarkerChange,
}: Props & { apiKey: string }) {
  const loaderOptions = {
    googleMapsApiKey: apiKey,
    libraries: MAPS_LIBRARIES as any,
  };

  const { isLoaded, loadError } = useJsApiLoader(loaderOptions);

  const mapRef = useRef<google.maps.Map | null>(null);
  const advMarkerRef = useRef<any>(null);

  const [localMarker, setLocalMarker] = useState<{ lat: number; lng: number }>(marker);
  const [query, setQuery] = useState<string>(address || '');
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[] | null>(null);
    const acServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
    const debounceRef = useRef<number | null>(null);
  const hasCoords = Number.isFinite(localMarker.lat) && Number.isFinite(localMarker.lng);
  const mapKey = `${hasCoords ? localMarker.lat : DEFAULT_CENTER.lat}-${hasCoords ? localMarker.lng : DEFAULT_CENTER.lng}`;

  const handleSearchAddress = async (addr?: string) => {
    const addressToSearch = addr ?? address;
    if (!addressToSearch) return;
    if (!(window as any).google || !(window as any).google.maps) {
      console.warn('Google maps not available for geocoding');
      return;
    }
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: addressToSearch }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const loc = results[0].geometry.location;
        const lat = loc.lat();
        const lng = loc.lng();
        console.log('Geocode result:', { lat, lng, address: results[0].formatted_address });
        setLocalMarker({ lat, lng });
        onMarkerChange(lat, lng);
        if (results[0].formatted_address) onAddressChange(results[0].formatted_address);
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(15);
        }
      } else {
        console.warn('Geocode failed:', status);
      }
    });
  };

  // Initialize services when map loads
  useEffect(() => {
    if ((window as any).google && (window as any).google.maps) {
      try {
        acServiceRef.current = new google.maps.places.AutocompleteService();
      } catch (e) {
        acServiceRef.current = null;
      }
    }
  }, [isLoaded]);

  // Sync external address -> local query
  useEffect(() => {
    setQuery(address || '');
  }, [address]);

  // cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  const fetchPredictions = (input: string) => {
    if (!acServiceRef.current || !input || input.length < 2) {
      setPredictions(null);
      return;
    }
    acServiceRef.current.getPlacePredictions({ input }, (preds, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && preds) {
        setPredictions(preds);
      } else {
        setPredictions(null);
      }
    });
  };

  const handleSelectPrediction = (p: google.maps.places.AutocompletePrediction) => {
    // Prefer geocoding by place_id via Geocoder (avoids PlacesService usage)
    if (!(window as any).google || !(window as any).google.maps) {
      handleSearchAddress(p.description);
      setPredictions(null);
      return;
    }
    const geocoder = new google.maps.Geocoder();
    if (p.place_id) {
      geocoder.geocode({ placeId: p.place_id }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          const lat = loc.lat();
          const lng = loc.lng();
          setLocalMarker({ lat, lng });
          onMarkerChange(lat, lng);
          if (results[0].formatted_address) onAddressChange(results[0].formatted_address);
          setQuery(results[0].formatted_address || p.description);
          setPredictions(null);
          if (mapRef.current) {
            mapRef.current.panTo({ lat, lng });
            mapRef.current.setZoom(15);
          }
        } else {
          handleSearchAddress(p.description);
          setPredictions(null);
        }
      });
    } else {
      handleSearchAddress(p.description);
      setPredictions(null);
    }
  };

  // Sync prop marker to local marker state
  useEffect(() => {
    if (Number.isFinite(marker.lat) && Number.isFinite(marker.lng)) {
      setLocalMarker({ lat: marker.lat, lng: marker.lng });
    }
  }, [marker.lat, marker.lng]);

  // Recenter map when marker coordinates change
  useEffect(() => {
    if (mapRef.current && localMarker.lat != null && localMarker.lng != null) {
      const newCenter = { lat: localMarker.lat, lng: localMarker.lng };
      mapRef.current.panTo(newCenter);
      mapRef.current.setZoom(15);
      console.log('Map recentered to:', newCenter);
      // update or create advanced marker
      try {
        const gm: any = (window as any).google;
        const pos = { lat: localMarker.lat, lng: localMarker.lng };
        if (advMarkerRef.current) {
          if (typeof advMarkerRef.current.setPosition === 'function') {
            advMarkerRef.current.setPosition(pos);
          } else if (advMarkerRef.current.position) {
            advMarkerRef.current.position = new gm.maps.LatLng(pos.lat, pos.lng);
          }
        } else {
          const AdvancedMarker = gm?.maps?.marker?.AdvancedMarkerElement;
          if (AdvancedMarker) {
            advMarkerRef.current = new AdvancedMarker({ position: pos, map: mapRef.current, draggable: isEditing });
            advMarkerRef.current.addListener?.('dragend', (ev: any) => {
              const lat = ev.latLng?.lat?.() ?? ev.position?.lat?.();
              const lng = ev.latLng?.lng?.() ?? ev.position?.lng?.();
              if (lat != null && lng != null) {
                setLocalMarker({ lat, lng });
                onMarkerChange(lat, lng);
              }
            });
          } else {
            // fallback to legacy Marker if AdvancedMarker isn't available
            advMarkerRef.current = new gm.maps.Marker({ position: pos, map: mapRef.current, draggable: isEditing });
            advMarkerRef.current.addListener('dragend', (e: any) => {
              const lat = e.latLng?.lat();
              const lng = e.latLng?.lng();
              if (lat != null && lng != null) {
                setLocalMarker({ lat, lng });
                onMarkerChange(lat, lng);
              }
            });
          }
        }
      } catch (e) {
        console.warn('Marker update/create failed', e);
      }
    }
  }, [localMarker.lat, localMarker.lng]);

  return (
    <>
      <div className="relative z-10 w-full">
        {loadError && (
          <input
            type="text"
            value={address}
            readOnly
            className="w-full min-w-0 rounded-lg border border-gray-300 px-4 py-3 bg-white text-sm text-red-600 outline-none"
            placeholder="Map load error"
          />
        )}
        {!loadError && isLoaded && (
          <div className="flex items-stretch gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  if (!isEditing) return;
                  const v = e.target.value;
                  setQuery(v);
                  onAddressChange(v);
                  if (debounceRef.current) window.clearTimeout(debounceRef.current);
                  debounceRef.current = window.setTimeout(() => fetchPredictions(v), 300);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchAddress(query); }}}
                placeholder="Search location or click on map"
                readOnly={!isEditing}
                className={`w-full min-w-0 rounded-lg border border-gray-300 px-4 py-3 bg-white text-sm text-gray-900 placeholder-gray-500 outline-none ${
                  !isEditing ? "cursor-not-allowed" : ""
                }`}
              />

              {predictions && predictions.length > 0 && isEditing && (
                <ul className="absolute left-0 right-0 mt-1 max-h-48 overflow-auto rounded-md bg-white border border-gray-200 shadow-lg z-50">
                  {predictions.map((p) => (
                    <li key={p.place_id} className="cursor-pointer px-3 py-2 hover:bg-gray-100" onMouseDown={(e) => { e.preventDefault(); handleSelectPrediction(p); }}>
                      {p.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleSearchAddress()}
              className="px-3 py-2 rounded-md bg-gray-100 border"
            >
              Search
            </button>
          </div>
        )}
        {!loadError && !isLoaded && (
          <input
            type="text"
            value={address}
            readOnly
            placeholder="Loading Google Maps..."
            className="w-full min-w-0 rounded-lg border border-gray-300 px-4 py-3 bg-white text-sm text-gray-900 placeholder-gray-500 outline-none cursor-wait"
          />
        )}
      </div>

      <div className="relative z-0 w-full h-[300px] rounded-lg overflow-hidden border border-gray-300 mt-2">
        {loadError && (
          <div className="flex items-center justify-center h-full text-xs text-red-600">
            Failed to load map. Check your API key and network connection.
          </div>
        )}
        {!loadError && isLoaded && (
          <GoogleMap
            key={mapKey}
            onLoad={(m) => {
              mapRef.current = m;
              // create marker at current position when map loads
              try {
                const gm: any = (window as any).google;
                const pos = hasCoords ? localMarker : DEFAULT_CENTER;
                const AdvancedMarker = gm?.maps?.marker?.AdvancedMarkerElement;
                if (AdvancedMarker) {
                  advMarkerRef.current = new AdvancedMarker({ position: pos, map: m, draggable: isEditing });
                  advMarkerRef.current.addListener?.('dragend', (ev: any) => {
                    const lat = ev.latLng?.lat?.() ?? ev.position?.lat?.();
                    const lng = ev.latLng?.lng?.() ?? ev.position?.lng?.();
                    if (lat != null && lng != null) {
                      setLocalMarker({ lat, lng });
                      onMarkerChange(lat, lng);
                    }
                  });
                } else {
                  advMarkerRef.current = new gm.maps.Marker({ position: pos, map: m, draggable: isEditing });
                  advMarkerRef.current.addListener('dragend', (e: any) => {
                    const lat = e.latLng?.lat();
                    const lng = e.latLng?.lng();
                    if (lat != null && lng != null) {
                      setLocalMarker({ lat, lng });
                      onMarkerChange(lat, lng);
                    }
                  });
                }
              } catch (e) {
                console.warn('Failed to create marker on map load', e);
              }
            }}
            mapContainerStyle={mapContainerStyle}
            center={hasCoords ? localMarker : DEFAULT_CENTER}
            zoom={15}
            onClick={
              isEditing
                ? (e) => {
                    const lat = e.latLng?.lat();
                    const lng = e.latLng?.lng();
                    if (lat != null && lng != null) {
                      setLocalMarker({ lat, lng });
                      onMarkerChange(lat, lng);
                    }
                  }
                : undefined
            }
            options={{
              disableDefaultUI: false,
              clickableIcons: false,
            }}
          />
        )}
        {!loadError && !isLoaded && (
          <div className="flex items-center justify-center h-full text-xs text-gray-500">
            Loading map...
          </div>
        )}
      </div>
    </>
  );
}
