import React, { useState, useEffect, useContext, useRef, useMemo } from "react";

import { MapboxContext } from "../../MapboxMap";
import PointLayer, { PointLayerProps } from "../PointLayer";
import { LngLat } from "mapbox-gl";

type MapEventHandler<TEvent = mapboxgl.MapMouseEvent> = (
  id: string | number,
  e: TEvent
) => void;
type NativeMapEventHandler<TEvent = mapboxgl.MapMouseEvent> = (
  e: TEvent & {
    features?: mapboxgl.MapboxGeoJSONFeature[] | undefined;
  }
) => void;
export type InteractivePointData = {
  /** Unique ID for this point that will be passed to all interaction event
   *  handlers
   */
  id: string | number;

  /** Flag indicating whether this point should respond to drag events */
  draggable?: boolean;

  /** Flag indicating whether this point should respond to click events */
  clickable?: boolean;

  /** Flag indicating whether this point should respond to hover events */
  hoverable?: boolean;

  /** Latitude position of this point */
  latitude: number;
  /** Longitude position of this point */
  longitude: number;

  /** Any data you want to make available to Mapbox style functions must go
   *  in the `properties` key
   */
  properties?: GeoJSON.GeoJsonProperties;
};

export type InteractivePointLayerProps = PointLayerProps & {
  points: InteractivePointData[];

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
    offset: mapboxgl.Point,
    e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent
  ) => void;
  onDragEnd?: MapEventHandler;
};

/** A controlled component that fires the appropriate callback for user events
 *  on an underlying point layer. Since this is a controlled component, it does
 *  not actually manage the hover state of each point or move points as they
 *  are dragged— that responsibility is left up to a higher level component.
 */
const InteractivePointLayer: React.FC<InteractivePointLayerProps> = (props) => {
  const {
    points,
    onClick,
    onHoverEnter,
    onHoverLeave,
    onDragStart,
    onDragEnd,
    onDrag,
  } = props;

  // Index points by ID for fast lookup
  const pointIndex = useMemo(
    () =>
      points.reduce((accum: Record<string, InteractivePointData>, p) => {
        accum[p.id] = p;
        return accum;
      }, {}),
    [points]
  );

  // Keep track of the last feature we were hovering over to trigger separate
  // hoverEnter and hoverLeave events
  const lastHoverId = useRef<string | number | null>(null);
  const dragging = useRef<{
    pointID: string | number;
    offset: mapboxgl.Point;
  } | null>(null);

  // Flag set once the underlying point layer has been added to the map
  const [pointLayerID, setPointLayerID] = useState<string | null>(null);
  const { map } = useContext(MapboxContext);

  // Set up event handlers
  useEffect(() => {
    if (!map || pointLayerID === null) return;
    const handleClick: NativeMapEventHandler = (e) => {
      const id =
        getPointsSortedByDistance(e)?.filter((f) => {
          if (f.id === null) return false;
          const match = pointIndex[f.id];
          return match && match.clickable;
        })[0]?.id ?? null;
      if (id === undefined || id === null) return;

      onClick?.(id, e);
    };
    // Handle hover events and drag events
    const handleMouseMove: NativeMapEventHandler = (e) => {
      // Don't do anything if we're currently dragging a point
      if (dragging.current !== null) return;
      const sortedFeatures = getPointsSortedByDistance(e);
      const closestHoverableID =
        sortedFeatures?.filter((f) => {
          if (f.id === null) return false;
          const match = pointIndex[f.id];
          return match && match.hoverable;
        })[0]?.id ?? null;

      // Only fire hover events if the feature beneath the pointer has changed
      if (closestHoverableID !== lastHoverId.current) {
        if (lastHoverId.current !== null) {
          onHoverLeave?.(lastHoverId.current, e);
        }

        if (closestHoverableID !== null) onHoverEnter?.(closestHoverableID, e);
        lastHoverId.current = closestHoverableID;
      }
    };

    const handleDrag: NativeMapEventHandler<
      mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent
    > = (e) => {
      if ((e.originalEvent as TouchEvent).touches?.length > 1) {
        e.preventDefault();
        return;
      }
      // Fire a drag event if currently dragging anything
      if (dragging.current !== null) {
        onDrag?.(dragging.current.pointID, dragging.current.offset, e);
      }
    };

    const handleMouseDown: NativeMapEventHandler<
      mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent
    > = (e) => {
      // Don't handle a touchstart event if we're already dragging something
      if (e.type === "touchstart" && dragging.current !== null) {
        return;
      }
      const closestFeature = getPointsSortedByDistance(e)?.filter((f) => {
        if (f.id === null) return false;
        const match = pointIndex[f.id];
        return match && match.draggable;
      })[0];

      const id = closestFeature?.id ?? null;

      if (
        id === null ||
        !closestFeature ||
        closestFeature.geometry?.type !== "Point"
      )
        return;

      // Start a new drag event
      const pointProjected = map.project(
        closestFeature.geometry.coordinates as [number, number]
      );
      const pointerProjected = map.project(e.lngLat);
      const offset = pointerProjected.sub(pointProjected);

      dragging.current = { pointID: id, offset };

      onDragStart?.(id, offset, e);
      e.preventDefault();
    };

    const handleMouseUp = (e: any) => {
      if (dragging.current === null) return;
      onDragEnd?.(dragging.current.pointID, e);
      dragging.current = null;

      if (lastHoverId.current !== null) {
        onHoverLeave?.(lastHoverId.current, e);
        lastHoverId.current = null;
      }
    };

    // Events for click and hover handlers
    map.on("click", pointLayerID, handleClick);
    map.on("mousemove", pointLayerID, handleMouseMove);
    map.on("mouseleave", pointLayerID, handleMouseMove);

    // Events for drag handlers
    map.on("mousedown", pointLayerID, handleMouseDown);
    map.on("mousemove", handleDrag);
    map.on("mouseup", handleMouseUp);

    map.on("touchstart", pointLayerID, handleMouseDown);
    map.on("touchmove", handleDrag);
    map.on("touchend", handleMouseUp);
    map.on("touchcancel", handleMouseUp);

    // Make sure to capture pointerup events anywhere in the window
    window.addEventListener("pointerup", handleMouseUp);

    // Clean up events when we're done
    return () => {
      map.off("click", pointLayerID, handleClick);
      map.off("mousemove", pointLayerID, handleMouseMove);
      map.off("mouseleave", pointLayerID, handleMouseMove);

      map.off("mousedown", pointLayerID, handleMouseDown);
      map.off("mousemove", handleDrag);
      map.off("mouseup", handleMouseUp);

      map.off("touchstart", pointLayerID, handleMouseDown);
      map.off("touchmove", handleDrag);
      map.off("touchend", handleMouseUp);
      map.off("touchcancel", handleMouseUp);

      window.removeEventListener("pointerup", handleMouseUp);
    };
  }, [
    map,
    onClick,
    onDrag,
    onDragEnd,
    onDragStart,
    onHoverEnter,
    onHoverLeave,
    pointIndex,
    pointLayerID,
  ]);

  return <PointLayer {...props} onAdd={setPointLayerID} />;
};

/** Given a Mapbox `MapMouseEvent`, sort any point features that the event
 *  involves by their distance to the mouse in ascending order.
 *
 *  Mapbox doesn't have any native concept of event capturing, so the event it
 *  fires will list out all the features that are hit. We most likely only want
 *  to get the one closest to the mouse event.
 */
const getPointsSortedByDistance = (
  e: (mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent) & {
    features?: mapboxgl.MapboxGeoJSONFeature[] | undefined;
  } & mapboxgl.EventData
) => {
  const features = e.features;
  if (!features) return null;
  const eventPoint = e.lngLat;

  return features
    .map((f) => ({
      ...f,
      id: (f.properties?.["id"] as number | string) ?? null,
      geometry: f.geometry, // This is a getter and needs to be manually copied
      distance:
        f.geometry.type === "Point"
          ? eventPoint.distanceTo(
              new LngLat(f.geometry.coordinates[0], f.geometry.coordinates[1])
            )
          : Infinity,
    }))
    .sort((a, b) => a.distance - b.distance);
};

export default InteractivePointLayer;
