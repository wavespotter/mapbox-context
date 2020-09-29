import { useRef, useEffect } from "react";

export type InteractiveBaseType = {
  /** Unique ID for this element that will be passed to all interaction event
   *  handlers
   */
  id: string | number;

  /** Flag indicating whether this element should respond to drag events */
  draggable?: boolean;

  /** Flag indicating whether this element should respond to click events */
  clickable?: boolean;

  /** Flag indicating whether this element should respond to hover events */
  hoverable?: boolean;

  /** Any data you want to make available to Mapbox style functions must go
   *  in the `properties` key
   */
  properties?: GeoJSON.GeoJsonProperties;
};

export type MapEventHandler<TEvent = mapboxgl.MapMouseEvent> = (
  id: string | number,
  e: TEvent
) => void;
export type NativeMapEventHandler<TEvent = mapboxgl.MapMouseEvent> = (
  e: TEvent & {
    features?: mapboxgl.MapboxGeoJSONFeature[] | undefined;
  }
) => void;

type NativeMapEventListener = <T extends keyof mapboxgl.MapLayerEventType>(
  ev: mapboxgl.MapLayerEventType[T] & mapboxgl.EventData
) => void;

type MapInteractionHandlerOptions = {
  map: mapboxgl.Map | null;
  layerID: string;

  /** An interaction pool can be used to ensure that only one event handler
   *  is fired even if multiple elements on multiple layers are hit by a
   *  single interaction.
   */
  interactionPool?: string;
  /** When using an interaction pool, the `priority` is used to give
   *  preference to certain layers, regardless of their draw order. Higher
   *  priority values will claim the interaction event before elements with
   *  lower priority values.
   */
  priority?: number;

  onClick?: MapEventHandler;
  onHoverEnter?: MapEventHandler;
  onHoverLeave?: MapEventHandler;
  onDragStart?: (
    id: string | number,
    offset: mapboxgl.Point,
    e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent
  ) => void;
  onDrag?: (
    id: string | number,
    newCoordinates: { longitude: number; latitude: number },
    offset: mapboxgl.Point,
    e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent
  ) => void;
  onDragEnd?: MapEventHandler;
};

// Pool structure is mapboxMap -> poolName -> layerName -> layerEventHandler
const interactionPools = new Map<
  mapboxgl.Map,
  Map<
    string,
    {
      disambiguationListener: NativeMapEventListener;
      layerHandlers: Map<string, MapEventHandler>;
    }
  >
>();
const getPoolLayers = (map: mapboxgl.Map, poolName: string) =>
  interactionPools.get(map)?.get(poolName) ?? [];

const addToPool = (
  map: mapboxgl.Map,
  poolName: string,
  layerID: string,
  handler: MapEventHandler
) => {
  // Create pools for this mapbox map if they don't already exist
  if (!interactionPools.get(map)) {
    interactionPools.set(map, new Map());
  }

  // Create the pool on the mapbox map if it doesn't already exist
  if (!interactionPools.get(map)?.get(poolName)) {
    interactionPools.get(map)?.set(poolName, new Map());
  }

  // Set a new handler for this layer in this pool on this mapbox map
  interactionPools.get(map)?.get(poolName)?.set(layerID, handler);
};

const removeFromPool = (
  map: mapboxgl.Map,
  poolName: string,
  layerID: string
) => {
  interactionPools.get(map)?.get(poolName)?.delete(layerID);
};

const useMapLayerInteractions = ({
  map,
  layerID,
  interactionPool: _interactionPool,
  priority,
  onClick,
  onHoverEnter,
  onHoverLeave,
  onDragStart,
  onDrag,
  onDragEnd,
}: MapInteractionHandlerOptions) => {
  const poolId = useRef(poolAutoId++);
  let interactionPool = _interactionPool;
  if (!_interactionPool) interactionPool = `auto-pool-${poolId.current}`;

  // Update the interaction pool membership list whenever the layerID or
  // interactionPool ID change
  useEffect(() => {
    if (!map || !interactionPool) return;
    addToPool(map, interactionPool, layerID);

    // Capture values and clean up
    const addedMap = map;
    const addedPool = interactionPool;
    const addedLayerID = layerID;
    return () => {
      removeFromPool(addedMap, addedPool, addedLayerID);
    };
  }, [layerID, interactionPool, map]);

  const poolLayers =
    map && interactionPool ? getPoolLayers(map, interactionPool) : [];
};
