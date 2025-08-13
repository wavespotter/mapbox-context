import mapboxgl, {
  LngLatBoundsLike,
  LngLatLike,
  MapOptions,
  RequestTransformFunction,
} from "mapbox-gl";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDeepCompareEffectNoCheck } from "use-deep-compare-effect";

import ZoomControl from "@mapbox-controls/zoom";
import MapboxContext, {
  MapboxMapTransform,
} from "../../contexts/MapboxContext";

export interface MapboxMapProps {
  token: string;
  styleUrl: string;
  width: string;
  height: string;
  showControls?: boolean;
  scrollZoom?: boolean;
  fitBounds?: {
    bounds: LngLatBoundsLike;
    options?: MapOptions["fitBoundsOptions"];
  };
  transformRequest?: RequestTransformFunction;
  center?: LngLatLike;
  zoom?: number;
  dragRotate?: boolean;
  touchZoomRotate?: boolean | { enableRotation: boolean };
  touchPitch?: boolean;
}

/** A modern Mapbox React component using hooks and context
 *  that supports composable, declarative data layers
 */
const MapboxMap: React.FC<MapboxMapProps> = ({
  token,
  styleUrl,
  width,
  height,
  children,
  showControls = false,
  scrollZoom = true,
  fitBounds,
  transformRequest,
  center,
  zoom,
  dragRotate = true,
  touchZoomRotate = true,
  touchPitch = true,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);

  // Store the current Mapbox map instance in component state
  const [map, setMap] = useState<mapboxgl.Map | null>(null);

  // Store map transform data in state so we can pass it to children
  const [transform, setTransform] = useState<MapboxMapTransform | null>(null);
  // maintain this reference so we can access it in the useEffect below without including it in the dependency array
  const transformRef = useRef(transform);
  transformRef.current = transform;

  // Let the parent component overwrite the map bounds
  useDeepCompareEffectNoCheck(() => {
    if (!map || !fitBounds) return;
    const { height, width } = map.getContainer().getBoundingClientRect();
    // make sure the padding in the options is not wider than the map
    // otherwise we crash the map
    let padding = fitBounds.options?.padding;
    if (typeof padding === "number") {
      const minDim = padding * 2;
      if (minDim >= height || minDim >= width) {
        padding = 0;
      }
    } else if (padding) {
      const { top = 0, right = 0, bottom = 0, left = 0 } = padding ?? {};
      const minWidth = right + left;
      const minHeight = top + bottom;
      if (minHeight >= height || minWidth >= width) {
        padding = 0;
      }
    }
    const options = { ...fitBounds.options, padding };
    map.fitBounds(fitBounds.bounds, options);
  }, [fitBounds, map]);

  // Let the parent component overwrite the map center
  useDeepCompareEffectNoCheck(() => {
    if (!map || !center) return;
    map.setCenter(center);
  }, [center]);

  // Create a new Mapbox map instance whenever token or style URL prop changes
  useEffect(() => {
    const newMap = new mapboxgl.Map({
      container: mapContainer.current ?? "",
      style: styleUrl,
      attributionControl: false,
      transformRequest,
      accessToken: token,
    });
    newMap.on("load", () => {
      setMap(newMap);
    });
    newMap.on("render", () => {
      const newCenter = newMap.getCenter();
      const zoom = newMap.getZoom();
      const center: [number, number] = [newCenter.lng, newCenter.lat];
      const bearing = newMap.getBearing();
      const pitch = newMap.getPitch();
      // no need to update the state if the values are the same
      if (
        zoom !== transformRef.current?.zoom ||
        center[0] !== transformRef.current?.center[0] ||
        center[1] !== transformRef.current?.center[1] ||
        bearing !== transformRef.current?.bearing ||
        pitch !== transformRef.current?.pitch
      ) {
        setTransform({
          zoom,
          center,
          bearing,
          pitch,
        });
      }
    });
    return () => {
      newMap.remove();
    };
  }, [token, styleUrl, transformRequest]);

  // Keep map up to date with the props
  useDeepCompareEffectNoCheck(() => {
    if (center) {
      map?.setCenter(center);
    }
  }, [center, map]);

  useEffect(() => {
    if (zoom !== undefined) {
      map?.setZoom(zoom);
    }
  }, [zoom, map]);

  useEffect(() => {
    if (scrollZoom) {
      map?.scrollZoom.enable();
    } else {
      map?.scrollZoom.disable();
    }
  }, [scrollZoom, map]);

  useEffect(() => {
    if (dragRotate) {
      map?.dragRotate.enable();
    } else {
      map?.dragRotate.disable();
    }
  }, [dragRotate, map]);

  useDeepCompareEffectNoCheck(() => {
    if (touchZoomRotate) {
      map?.touchZoomRotate.enable();
      map?.touchZoomRotate.enableRotation();
      if (touchZoomRotate instanceof Object) {
        if (touchZoomRotate.enableRotation) {
          map?.touchZoomRotate.enableRotation();
        } else {
          map?.touchZoomRotate.disableRotation();
        }
      }
    } else {
      map?.touchZoomRotate.disable();
    }
  }, [touchZoomRotate, map]);

  useEffect(() => {
    if (touchPitch) {
      map?.touchPitch.enable();
    } else {
      map?.touchPitch.disable();
    }
  }, [touchPitch, map]);

  const zoomControl = useRef<ZoomControl>();
  useEffect(() => {
    if (showControls) {
      zoomControl.current = new ZoomControl();
      map?.addControl(zoomControl.current, "top-right");
    } else {
      if (zoomControl.current) map?.removeControl(zoomControl.current);
    }
  }, [showControls, map]);

  const { width: containerBoundsWidth, height: containerBoundsHeight } =
    mapContainer.current?.getBoundingClientRect() || {};

  const providerValue = useMemo(
    () => ({
      map,
      width: containerBoundsWidth || 0,
      height: containerBoundsHeight || 0,
      transform,
    }),
    [map, containerBoundsWidth, containerBoundsHeight, transform]
  );

  return (
    <>
      <div style={{ width, height, overflow: "hidden", position: "relative" }}>
        <div
          ref={mapContainer}
          style={{ position: "absolute", width, height }}
        />
        <MapboxContext.Provider value={providerValue}>
          {children}
        </MapboxContext.Provider>
      </div>
    </>
  );
};

export default MapboxMap;
export { MapboxContext };
