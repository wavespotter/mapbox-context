import React, { useCallback, useContext } from "react";
import MapboxContext from "../../../contexts/MapboxContext";

interface MapboxDOMLayerProps {
  /** Geographic coordinates of the element. The component's children will
   *  automatically move with the map to stay at this point.
   */
  position: { latitude: number; longitude: number };

  center?: boolean;

  /** Rotation of the element, with 0 degrees pointing to true north. */
  heading?: number;

  tiltWithMap?: boolean;
  rotateWithMap?: boolean;
  renderWorldCopies?: boolean;

  /** If `trapScroll` is `true`, user scroll events on the DOM element will not
   *  affect the zoom level on the map. If `false`, the scroll wheel will zoom
   *  the map as usual.
   */
  trapScroll?: boolean;

  /** If `trapMouse` is `true`, user mouse events on the DOM element will not
   *  pan the map. If `false`, dragging the mouse will pan as usual.
   */
  trapMouse?: boolean;

  /** An optional function that allows you to scale the DOM contents based on
   *  zoom level
   */
  zoomFunction?: (z: number) => number;
  children?: React.ReactNode;
}

/** Pin any DOM element to a specific position on the Mapbox map. */
const MapboxDOMLayer = ({
  position,
  heading,
  zoomFunction,
  center = true,
  trapScroll = false,
  trapMouse = false,
  tiltWithMap = true,
  rotateWithMap = true,
  renderWorldCopies = false,
  children,
}: MapboxDOMLayerProps) => {
  const { map, transform, width } = useContext(MapboxContext);

  // Forward scroll events to the Mapbox map
  const scrollHandler = useCallback(
    (ev: React.WheelEvent<HTMLDivElement>) => {
      ev.preventDefault();
      map
        ?.getCanvas()
        .dispatchEvent(new WheelEvent(ev.nativeEvent.type, ev.nativeEvent));
    },
    [map]
  );

  // Forward mouse events to the Mapbox map
  const pointerHandler = useCallback(
    (ev: React.PointerEvent<HTMLDivElement>) => {
      map
        ?.getCanvas()
        .dispatchEvent(new PointerEvent(ev.nativeEvent.type, ev.nativeEvent));
    },
    [map]
  );

  if (map !== null && position && transform) {
    // Figure out placement and scaling of DOM contents based on map transform
    let _projected = map.project([position.longitude, position.latitude]);
    while (_projected.x < 0) {
      position.longitude += 360;
      _projected = map.project([position.longitude, position.latitude]);
    }
    while (_projected.x > width) {
      position.longitude -= 360;
      _projected = map.project([position.longitude, position.latitude]);
    }

    let projected = renderWorldCopies
      ? [
          map.project([position.longitude - 360, position.latitude]),
          map.project([position.longitude, position.latitude]),
          map.project([position.longitude + 360, position.latitude]),
        ]
      : [map.project([position.longitude, position.latitude])];

    // Filter out extreme points
    projected = projected.filter(
      (p) => p.x < width * 1.5 && p.x > -width * 1.5
    );

    const rotation = rotateWithMap ? (heading || 0) - transform.bearing : 0;
    const pitch = tiltWithMap ? transform.pitch : 0;

    const scaleFactor = zoomFunction ? zoomFunction(transform.zoom) : 1;

    return (
      <>
        {projected.map((p, i) => (
          <div
            key={`copy-${i}`}
            style={{
              position: "absolute",
              transform: `${center ? "translate(-50%, -50%)" : ""}
                          translate(${p.x}px,  ${p.y}px)
                          ${pitch ? `rotateX(${pitch}deg)` : ""}
                          ${rotation ? `rotateZ(${rotation}deg)` : ""}
                          ${scaleFactor !== 1 ? `scale(${scaleFactor})` : ""}`,
            }}
            onWheel={!trapScroll ? scrollHandler : undefined}
            onPointerDown={!trapMouse ? pointerHandler : undefined}
            onPointerUp={!trapMouse ? pointerHandler : undefined}
            onMouseDown={!trapMouse ? pointerHandler : undefined}
            onMouseUp={!trapMouse ? pointerHandler : undefined}
          >
            {children}
          </div>
        ))}
      </>
    );
  } else {
    return null;
  }
};

export default MapboxDOMLayer;
