import React, { useEffect, useState, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";

import ZoomControl from "mapbox-gl-controls/lib/zoom";

import MapboxContext, {
  MapboxMapTransform,
} from "../../contexts/mapboxContext";

type MapboxMapProps = {
  token: string;
  styleUrl: string;
  width: string;
  height: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  showControls?: boolean;
  scrollZoom?: boolean;
  fitBounds?: {
    bounds: mapboxgl.LngLatBoundsLike;
    options?: mapboxgl.FitBoundsOptions;
  };
  transformRequest?: mapboxgl.TransformRequestFunction;
};

/** A modern Mapbox React component using hooks and context
 *  that supports composeable, declarative data layers
 */
const MapboxMap: React.FC<MapboxMapProps> = ({
  token,
  styleUrl,
  width,
  height,
  children,
  initialCenter,
  initialZoom,
  showControls,
  scrollZoom = true,
  fitBounds,
  transformRequest,
}) => {
  let mapContainer = useRef<HTMLDivElement>(null);

  // Store the current Mapbox map instance in component state
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Store map transform data in state so we can pass it to children
  const [transform, setTransform] = useState<MapboxMapTransform | null>(null);

  // Let the parent component overrite the map bounds
  usePropChangeEffect(fitBounds, () => {
    if (!map || !fitBounds) return;
    map.fitBounds(fitBounds.bounds, fitBounds.options);
  });

  const initializeMap = useCallback(
    (map) => {
      if (fitBounds) {
        map?.fitBounds(fitBounds.bounds, fitBounds.options);
      }
      if (showControls) {
        map?.addControl(new ZoomControl(), "top-right");
      }
    },
    [showControls, fitBounds]
  );

  // Create a new Mapbox map instance whenver token or style URL prop changes
  useEffect(() => {
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainer.current ?? "",
      style: styleUrl,
      attributionControl: false,
      transformRequest,
    });

    map.on("load", () => {
      setMap(map);
      initializeMap(map);
    });

    map.on("render", () => {
      const center = map.getCenter();
      setTransform({
        zoom: map.getZoom(),
        center: [center.lng, center.lat],
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      });
    });

    if (!scrollZoom) map.scrollZoom.disable();

    return () => {
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, styleUrl, transformRequest, scrollZoom]);

  // Update center and zoom whenever it changes
  useEffect(() => {
    if (map && !initialized) {
      if (initialCenter) {
        map.setCenter(initialCenter);
      }
      if (initialZoom !== undefined) {
        map.setZoom(initialZoom);
      }
      setInitialized(true);
    }
  }, [map, initialCenter, initialZoom, initialized]);

  const containerBounds = mapContainer.current?.getBoundingClientRect();

  return (
    <>
      <div style={{ width, height, overflow: "hidden", position: "relative" }}>
        <div
          ref={mapContainer}
          style={{ position: "absolute", width, height }}
        />
        <MapboxContext.Provider
          value={{
            map,
            width: containerBounds?.width || 0,
            height: containerBounds?.height || 0,
            transform,
          }}
        >
          {children}
        </MapboxContext.Provider>
      </div>
    </>
  );
};

function usePropChangeEffect<T>(prop: T, onChange: (newValue: T) => void) {
  const [oldPropValue, setOldPropValue] = useState<T>(prop);
  if (prop !== oldPropValue) {
    onChange(prop);
    setOldPropValue(prop);
  }
}

export default MapboxMap;
export { MapboxContext };
