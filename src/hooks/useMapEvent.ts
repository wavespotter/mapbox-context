import type { MapEventType } from "mapbox-gl";
import { useContext, useEffect } from "react";
import MapboxContext from "../contexts/MapboxContext";

const useMapEvent = <T extends MapEventType>(
  type: T,
  // TODO: Determine if there is a type that works here :\
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (event: any) => void
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
