import { useEffect } from "react";
import EventData, { LngLat } from "mapbox-gl";

export type InteractiveLayerProps = {
  /** Optional name of an "event handler pool". Only one callback per event pool
   *  will be called for each underlying Mapbox event. By default, all layers
   *  share the same global event pool, but if you have overlapping layers you
   *  may wish to do your own event disambiguation.
   */
  eventHandlerPool?: string;

  /** Optional priority value for this layer within its event handler pool.
   *  Lower priority values will be favored and become the target of events
   *  before layers with a higher priority.
   */
  eventHandlerPriority?: number;

  onClick?: MapEventHandler;
  onHoverEnter?: MapEventHandler;
  onHoverLeave?: MapEventHandler;
  onDragStart?: MapDragStartHandler;
  onDrag?: MapDragHandler;
  onDragEnd?: MapEventHandler;
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

export type MapDragStartHandler = (
  id: string | number,
  offset: mapboxgl.Point,
  e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent
) => void;
export type MapDragHandler = (
  id: string | number,
  newCoordinates: { longitude: number; latitude: number },
  offset: mapboxgl.Point,
  e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent
) => void;

type MapInteractionHandlerOptions = {
  map: mapboxgl.Map | null;
  layerID: string | null;

  /** An interaction pool can be used to ensure that only one event handler
   *  is fired even if multiple elements on multiple layers are hit by a
   *  single interaction.
   */
  eventHandlerPool?: string;
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

type eventHandlerPoolLayerDefinition = {
  id: string;
  priority: number;
  onClick?: MapEventHandler;
  onHoverLeave?: MapEventHandler;
  onHoverEnter?: MapEventHandler;
  onDrag?: MapDragHandler;
  onDragStart?: MapDragStartHandler;
  onDragEnd?: MapEventHandler;
};

class MapboxEventHandlerPool {
  private layers: eventHandlerPoolLayerDefinition[];
  private lastHoverFeature: mapboxgl.MapboxGeoJSONFeature | null = null;
  private dragging: {
    feature: mapboxgl.MapboxGeoJSONFeature;
    offset: mapboxgl.Point;
  } | null = null;

  private registered = false;

  constructor(private map: mapboxgl.Map, private name: string) {
    this.map = map;
    this.layers = [];
    this.register();
  }

  public register() {
    // Register event listeners on creation
    // Events for click and hover handlers
    this.map.on("click", this.onClick);
    this.map.on("mousemove", this.onMouseMove);
    this.map.on("mouseleave", this.onMouseMove);

    // Events for drag handlers
    this.map.on("mousedown", this.onMouseDown);
    this.map.on("mousemove", this.onDrag);
    this.map.on("mouseup", this.onMouseUp);

    this.map.on("touchstart", this.onMouseDown);
    this.map.on("touchmove", this.onDrag);
    this.map.on("touchend", this.onMouseUp);
    this.map.on("touchcancel", this.onMouseUp);

    // Make sure to capture pointerup events anywhere in the window
    window.addEventListener("pointerup", this.onMouseUp);
    this.registered = true;
  }

  public unregister() {
    // Clean up events when we're done
    this.map.off("click", this.onClick);
    this.map.off("mousemove", this.onMouseMove);
    this.map.off("mouseleave", this.onMouseMove);

    // Events for drag handlers
    this.map.off("mousedown", this.onMouseDown);
    this.map.off("mousemove", this.onDrag);
    this.map.off("mouseup", this.onMouseUp);

    this.map.off("touchstart", this.onMouseDown);
    this.map.off("touchmove", this.onDrag);
    this.map.off("touchend", this.onMouseUp);
    this.map.off("touchcancel", this.onMouseUp);

    // Make sure to capture pointerup events anywhere in the window
    window.removeEventListener("pointerup", this.onMouseUp);

    this.registered = false;
  }

  public onClick: NativeMapEventHandler<mapboxgl.MapMouseEvent> = (e: any) => {
    // Find the highest-ranked clickable feature
    const highestPriorityClickableFeature =
      this.sortEventFeatures(e)?.find((f) => {
        if (f.properties?.id === null) return false;
        return !!f.properties?.clickable;
      }) ?? null;

    if (
      highestPriorityClickableFeature === null ||
      highestPriorityClickableFeature.properties?.id === undefined ||
      highestPriorityClickableFeature.properties?.id === null
    )
      return;

    // Call the appropriate layer's registered onClick handler
    this.layers
      .find((l) => l.id === highestPriorityClickableFeature.layer?.id)
      ?.onClick?.(highestPriorityClickableFeature.properties.id, e);
  };

  // Handle hover events and drag events
  public onMouseMove: NativeMapEventHandler = (e: any) => {
    // Don't do anything if we're currently dragging a point
    if (this.dragging !== null) return;
    const sortedFeatures = this.sortEventFeatures(e);
    const highestPriorityHoverableFeature =
      sortedFeatures?.find((f) => {
        if (f.properties?.id === null || f.properties?.id === undefined)
          return false;
        return !!f.properties?.hoverable;
      }) ?? null;

    // Only fire hover events if the feature beneath the pointer has changed
    if (
      highestPriorityHoverableFeature?.properties?.id !==
        this.lastHoverFeature?.properties?.id ||
      highestPriorityHoverableFeature?.layer?.id !==
        this.lastHoverFeature?.layer?.id
    ) {
      // Call the appropriate layer's registered onHoverLeave handler
      if ((this.lastHoverFeature?.properties?.id ?? null) !== null) {
        this.layers
          .find((l) => l.id === this.lastHoverFeature?.layer?.id)
          ?.onHoverLeave?.(this.lastHoverFeature?.properties?.id!, e);
      }

      if ((highestPriorityHoverableFeature?.properties?.id ?? null) !== null) {
        this.layers
          .find((l) => l.id === highestPriorityHoverableFeature?.layer?.id)
          ?.onHoverEnter?.(highestPriorityHoverableFeature?.properties?.id, e);
      }
      this.lastHoverFeature = highestPriorityHoverableFeature;
    }
  };

  public onDrag: NativeMapEventHandler<
    mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent
  > = (e) => {
    if ((e.originalEvent as TouchEvent).touches?.length > 1) {
      e.preventDefault();
      return;
    }
    // Fire a drag event if currently dragging anything
    if (this.dragging !== null) {
      const pointerProjected = this.map.project(e.lngLat);
      const offsetLngLat = this.map.unproject(
        pointerProjected.sub(this.dragging.offset)
      );

      if (this.dragging.feature.properties?.id === undefined) return;

      // Fire event on appropriate layer's onDrag handler
      this.layers
        .find((l) => l.id === this.dragging?.feature.layer?.id)
        ?.onDrag?.(
          this.dragging.feature.properties?.id,
          { longitude: offsetLngLat.lng, latitude: offsetLngLat.lat },
          this.dragging.offset,
          e
        );
    }
  };

  public onMouseDown: NativeMapEventHandler<
    mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent
  > = (e: any) => {
    // Don't handle a touchstart event if we're already dragging something
    if (e.type === "touchstart" && this.dragging !== null) {
      return;
    }

    // Find the highest-ranked clickable feature
    const highestPriorityDragableFeature =
      this.sortEventFeatures(e)?.find((f) => {
        if (f.properties?.id === null) return false;
        return !!f.properties?.draggable;
      }) ?? null;

    const id = highestPriorityDragableFeature?.properties?.id ?? null;

    if (
      id === null ||
      !highestPriorityDragableFeature ||
      highestPriorityDragableFeature.geometry?.type !== "Point"
    )
      return;

    // Start a new drag event
    const pointProjected = this.map.project(
      highestPriorityDragableFeature.geometry.coordinates as [number, number]
    );
    const pointerProjected = this.map.project(e.lngLat);
    const offset = pointerProjected.sub(pointProjected);

    this.dragging = { feature: highestPriorityDragableFeature, offset };

    // Fire event on appropriate layer's onDragStart handler
    this.layers
      .find((l) => l.id === highestPriorityDragableFeature.layer?.id)
      ?.onDragStart?.(
        highestPriorityDragableFeature.properties?.id!,
        offset,
        e
      );
    e.preventDefault();
  };

  public onMouseUp = (e: any) => {
    if (this.dragging === null) return;

    // Fire event on appropriate layer's onDragEnd handler
    this.layers
      .find((l) => l.id === this.dragging?.feature.layer?.id)
      ?.onDragEnd?.(this.dragging.feature.properties?.id!, e);

    this.dragging = null;

    // Fire event on appropriate layer's onHoverLeave handler
    if (this.lastHoverFeature !== null) {
      this.layers
        .find((l) => l.id === this.lastHoverFeature?.layer?.id)
        ?.onHoverLeave?.(this.lastHoverFeature.properties?.id!, e);

      this.lastHoverFeature = null;
    }
  };

  public addLayerListeners(listeners: eventHandlerPoolLayerDefinition) {
    // See if there's a match
    const matchIdx = this.layers.findIndex((l) => l.id === listeners.id);
    if (matchIdx === -1) {
      // Add a new layer definition if none exists
      this.layers.push(listeners);
    } else {
      // Otherwise, merge definitions
      this.layers[matchIdx] = { ...this.layers[matchIdx], ...listeners };
    }

    // Re-register map event handlers if needed
    if (!this.registered) this.register();
  }
  public removeLayerListeners(layerID: string) {
    this.layers = this.layers.filter((l) => l.id !== layerID);

    // Unregister map event handlers when no layers are listening
    if (this.layers.length === 0) this.unregister();
  }

  /** Sort features according to layer priority order as well as distance to
   *  each feature
   */
  private sortEventFeatures(
    e: (mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent) & typeof EventData
  ) {
    const features = this.map.queryRenderedFeatures(e.point, {
      layers: this.layers.map((l) => l.id),
    });
    // Sort features by layer priority, then by distance to the features
    const featuresByLayer = this.layers
      .sort((a, b) => a.priority - b.priority)
      .map(({ id, priority }) => ({
        layerID: id,
        priority,
        features:
          features
            ?.filter((f) => f.layer?.id === id)
            .sort(
              (a, b) =>
                getDistanceToFeature(e.lngLat, a) -
                getDistanceToFeature(e.lngLat, b)
            ) ?? [],
      }));

    return featuresByLayer.flatMap((f) => f.features);
  }
}

function getDistanceToFeature(
  eventPoint: LngLat,
  f: mapboxgl.MapboxGeoJSONFeature
) {
  // Distance to feature is only really meaningful for `Point` features.
  // Otherwise, look to the feature's `priority` value if it exists
  // And finally, fall back to using a `0` distance, meaning disambiguation will
  // just use whichever feature occurs first
  if (f.geometry.type === "Point") {
    return eventPoint.distanceTo(
      new LngLat(f.geometry.coordinates[0], f.geometry.coordinates[1])
    );
  } else return f.properties?.priority ?? 0;
}

/** A singleton mapping of event handler pools for each Mapbox Map */
const eventHandlerPools = new Map<
  mapboxgl.Map,
  Map<string, MapboxEventHandlerPool>
>();

/** Gets an event handler pool with the given name on the given Mapbox GL map.
 *  Creates the pool if it doesn't already exist.
 */
function getEventHandlerPool(
  map: mapboxgl.Map,
  poolName: string
): MapboxEventHandlerPool {
  // Create the pool if it doesn't already exist
  if (!eventHandlerPools.get(map)) {
    eventHandlerPools.set(map, new Map());
  }
  if (!eventHandlerPools.get(map)?.get(poolName)) {
    eventHandlerPools
      .get(map)!
      .set(poolName, new MapboxEventHandlerPool(map, poolName));
  }
  return eventHandlerPools.get(map)!.get(poolName)!;
}

const useMapLayerInteractions = ({
  map,
  layerID,
  eventHandlerPool: _eventHandlerPool,
  priority,
  onClick,
  onHoverEnter,
  onHoverLeave,
  onDragStart,
  onDrag,
  onDragEnd,
}: MapInteractionHandlerOptions) => {
  let eventHandlerPool = _eventHandlerPool;
  if (!_eventHandlerPool) eventHandlerPool = `shared-event-pool`;

  // Update the interaction pool whenever the parameters to this hook change
  useEffect(() => {
    if (!map || !eventHandlerPool || !layerID) return;

    const pool = getEventHandlerPool(map, eventHandlerPool);

    pool.addLayerListeners({
      id: layerID,
      priority: priority ?? Infinity,
      onClick,
      onHoverEnter,
      onHoverLeave,
      onDragStart,
      onDrag,
      onDragEnd,
    });

    return () => {
      pool.removeLayerListeners(layerID);
    };
  }, [
    layerID,
    eventHandlerPool,
    map,
    priority,
    onClick,
    onHoverEnter,
    onHoverLeave,
    onDragStart,
    onDrag,
    onDragEnd,
  ]);
};

export default useMapLayerInteractions;
