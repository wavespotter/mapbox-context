import type { MapEventOf, MapEventType } from "mapbox-gl";
import { useContext, useEffect } from "react";
import MapboxContext from "../contexts/MapboxContext";

const useMapEvent = <T extends MapEventType>(
  type: T,
  handler: (event: MapEventOf<T>) => void
) => {
  const { map } = useContext(MapboxContext);

  useEffect(() => {
    if (map) {
      map.on(type, handler);
    }
    return () => {
      if (map) {
        map.off(type, handler);
      }
    };
  }, [map, type, handler]);
};

export default useMapEvent;
