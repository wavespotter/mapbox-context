export const foo = "";
// import React, { useState, useEffect, useContext, useRef, useMemo } from "react";

// import { MapboxContext } from "../../MapboxMap";
// import LineLayer, { LineLayerProps, LineCoordinates } from "../LineLayer";
// import { LngLat } from "mapbox-gl";
// import {
//   InteractiveBaseType,
//   MapEventHandler,
//   NativeMapEventHandler,
// } from "../../../hooks/useMapInteractions";

// export type InteractiveLineData = InteractiveBaseType & {
//   coordinates: LineCoordinates;
// };

// export type InteractiveLineLayerProps = LineLayerProps & {
//   lines: InteractiveLineData[];

//   onClick?: MapEventHandler;
//   onHoverEnter?: MapEventHandler;
//   onHoverLeave?: MapEventHandler;
// };

// /** A controlled component that fires the appropriate callback for user events
//  *  on an underlying line layer. Since this is a controlled component, it does
//  *  not actually manage the hover state of each line or move lines as they
//  *  are dragged— that responsibility is left up to a higher level component.
//  */
// const InteractiveLineLayer: React.FC<InteractiveLineLayerProps> = ({
//   lines,
//   onClick,
//   onHoverEnter,
//   onHoverLeave,
// }) => {
//   // Index lines by ID for fast lookup
//   const lineIndex = useMemo(
//     () =>
//       lines.reduce((accum: Record<string, InteractiveLineData>, p) => {
//         accum[p.id] = p;
//         return accum;
//       }, {}),
//     [lines]
//   );

//   // Keep track of the last feature we were hovering over to trigger separate
//   // hoverEnter and hoverLeave events
//   const lastHoverId = useRef<string | number | null>(null);
//   const dragging = useRef<{
//     pointID: string | number;
//     offset: mapboxgl.Point;
//   } | null>(null);

//   // Flag set once the underlying point layer has been added to the map
//   const [LineLayerID, setLineLayerID] = useState<string | null>(null);
//   const { map } = useContext(MapboxContext);

//   // Set up event handlers
//   useEffect(() => {
//     if (!map || LineLayerID === null) return;
//     const handleClick: NativeMapEventHandler = (e) => {
//       const id =
//         getPointsSortedByDistance(e)?.find((f) => {
//           if (f.id === null) return false;
//           const match = lineIndex[f.id];
//           return match && match.clickable;
//         })?.id ?? null;
//       if (id === undefined || id === null) return;

//       onClick?.(id, e);
//     };
//     // Handle hover events and drag events
//     const handleMouseMove: NativeMapEventHandler = (e) => {
//       // Don't do anything if we're currently dragging a point
//       if (dragging.current !== null) return;
//       const sortedFeatures = getPointsSortedByDistance(e);
//       const closestHoverableID =
//         sortedFeatures?.find((f) => {
//           if (f.id === null) return false;
//           const match = lineIndex[f.id];
//           return match && match.hoverable;
//         })?.id ?? null;

//       // Only fire hover events if the feature beneath the pointer has changed
//       if (closestHoverableID !== lastHoverId.current) {
//         if (lastHoverId.current !== null) {
//           onHoverLeave?.(lastHoverId.current, e);
//         }

//         if (closestHoverableID !== null) onHoverEnter?.(closestHoverableID, e);
//         lastHoverId.current = closestHoverableID;
//       }
//     };

//     const handleDrag: NativeMapEventHandler<
//       mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent
//     > = (e) => {
//       if ((e.originalEvent as TouchEvent).touches?.length > 1) {
//         e.preventDefault();
//         return;
//       }
//       // Fire a drag event if currently dragging anything
//       if (dragging.current !== null) {
//         const pointerProjected = map.project(e.lngLat);
//         const offsetLngLat = map.unproject(
//           pointerProjected.sub(dragging.current.offset)
//         );
//         onDrag?.(
//           dragging.current.pointID,
//           { longitude: offsetLngLat.lng, latitude: offsetLngLat.lat },
//           dragging.current.offset,
//           e
//         );
//       }
//     };

//     const handleMouseDown: NativeMapEventHandler<
//       mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent
//     > = (e) => {
//       // Don't handle a touchstart event if we're already dragging something
//       if (e.type === "touchstart" && dragging.current !== null) {
//         return;
//       }
//       const closestFeature = getPointsSortedByDistance(e)?.find((f) => {
//         if (f.id === null) return false;
//         const match = lineIndex[f.id];
//         return match && match.draggable;
//       });

//       const id = closestFeature?.id ?? null;

//       if (
//         id === null ||
//         !closestFeature ||
//         closestFeature.geometry?.type !== "Point"
//       )
//         return;

//       // Start a new drag event
//       const pointProjected = map.project(
//         closestFeature.geometry.coordinates as [number, number]
//       );
//       const pointerProjected = map.project(e.lngLat);
//       const offset = pointerProjected.sub(pointProjected);

//       dragging.current = { pointID: id, offset };

//       onDragStart?.(id, offset, e);
//       e.preventDefault();
//     };

//     const handleMouseUp = (e: any) => {
//       if (dragging.current === null) return;
//       onDragEnd?.(dragging.current.pointID, e);
//       dragging.current = null;

//       if (lastHoverId.current !== null) {
//         onHoverLeave?.(lastHoverId.current, e);
//         lastHoverId.current = null;
//       }
//     };

//     // Events for click and hover handlers
//     map.on("click", LineLayerID, handleClick);
//     map.on("mousemove", LineLayerID, handleMouseMove);
//     map.on("mouseleave", LineLayerID, handleMouseMove);

//     // Events for drag handlers
//     map.on("mousedown", LineLayerID, handleMouseDown);
//     map.on("mousemove", handleDrag);
//     map.on("mouseup", handleMouseUp);

//     map.on("touchstart", LineLayerID, handleMouseDown);
//     map.on("touchmove", handleDrag);
//     map.on("touchend", handleMouseUp);
//     map.on("touchcancel", handleMouseUp);

//     // Make sure to capture pointerup events anywhere in the window
//     window.addEventListener("pointerup", handleMouseUp);

//     // Clean up events when we're done
//     return () => {
//       map.off("click", LineLayerID, handleClick);
//       map.off("mousemove", LineLayerID, handleMouseMove);
//       map.off("mouseleave", LineLayerID, handleMouseMove);

//       map.off("mousedown", LineLayerID, handleMouseDown);
//       map.off("mousemove", handleDrag);
//       map.off("mouseup", handleMouseUp);

//       map.off("touchstart", LineLayerID, handleMouseDown);
//       map.off("touchmove", handleDrag);
//       map.off("touchend", handleMouseUp);
//       map.off("touchcancel", handleMouseUp);

//       window.removeEventListener("pointerup", handleMouseUp);
//     };
//   }, [
//     map,
//     onClick,
//     onDrag,
//     onDragEnd,
//     onDragStart,
//     onHoverEnter,
//     onHoverLeave,
//     lineIndex,
//     LineLayerID,
//   ]);

//   return <LineLayer {...props} onAdd={setLineLayerID} />;
// };

// /** Given a Mapbox `MapMouseEvent`, sort any point features that the event
//  *  involves by their distance to the mouse in ascending order.
//  *
//  *  Mapbox doesn't have any native concept of event capturing, so the event it
//  *  fires will list out all the features that are hit. We most likely only want
//  *  to get the one closest to the mouse event.
//  */
// const getPointsSortedByDistance = (
//   e: (mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent) & {
//     features?: mapboxgl.MapboxGeoJSONFeature[] | undefined;
//   } & mapboxgl.EventData
// ) => {
//   const features = e.features;
//   if (!features) return null;
//   const eventPoint = e.lngLat;

//   return features
//     .map((f) => ({
//       ...f,
//       id: (f.properties?.["id"] as number | string) ?? null,
//       geometry: f.geometry, // This is a getter and needs to be manually copied
//       distance:
//         f.geometry.type === "Point"
//           ? eventPoint.distanceTo(
//               new LngLat(f.geometry.coordinates[0], f.geometry.coordinates[1])
//             )
//           : Infinity,
//     }))
//     .sort((a, b) => a.distance - b.distance);
// };

// export default InteractiveLineLayer;
