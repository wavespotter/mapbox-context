import { useContext, useEffect } from "react";
import MapboxContext from "../contexts/mapboxContext";

type HandlerType<T extends keyof mapboxgl.MapEventType> = (
  ev: mapboxgl.MapEventType[T] & mapboxgl.EventData
) => void;
const useMapEvent: <T extends keyof mapboxgl.MapEventType>(
  type: T,
  handler: HandlerType<T>
) => void = (type, handler) => {
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
