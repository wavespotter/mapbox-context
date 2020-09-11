import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDeepCompareEffectNoCheck } from 'use-deep-compare-effect';
import mapboxgl from "mapbox-gl";

import ZoomControl from "mapbox-gl-controls/lib/zoom";
import MapboxContext, {
  MapboxMapTransform,
} from "../../contexts/MapboxContext";

type MapboxMapProps = {
  token: string;
  styleUrl: string;
  width: string;
  height: string;
  showControls?: boolean;
  scrollZoom?: boolean;
  fitBounds?: {
    bounds: mapboxgl.LngLatBoundsLike;
    options?: mapboxgl.FitBoundsOptions;
  };
  transformRequest?: mapboxgl.TransformRequestFunction;
  center?: mapboxgl.LngLatLike;
  zoom?: number;
  dragRotate?: boolean;
  touchZoomRotate?: boolean | { enableRotation: boolean};
};

/** A modern Mapbox React component using hooks and context
 *  that supports composable, declarative data layers
 */
const MapboxMap: React.FC<MapboxMapProps> = ({
  token,
  styleUrl,
  width,
  height,
  children,
  showControls,
  scrollZoom = true,
  fitBounds,
  transformRequest,
  center,
  zoom,
  dragRotate = true,
  touchZoomRotate = true,
}) => {
  let mapContainer = useRef<HTMLDivElement>(null);

  // Store the current Mapbox map instance in component state
  const [map, setMap] = useState<mapboxgl.Map | null>(null);

  // Store map transform data in state so we can pass it to children
  const [transform, setTransform] = useState<MapboxMapTransform | null>(null);

  // Let the parent component overwrite the map bounds
  useDeepCompareEffectNoCheck( () => {
      if (!map || !fitBounds) return;
    map.fitBounds(fitBounds.bounds, fitBounds.options);
  },[fitBounds]);

  // Let the parent component overwrite the map center
  useDeepCompareEffectNoCheck( () => {
    if (!map || !center) return;
    map.setCenter(center);
  },[center]);

  // Create a new Mapbox map instance whenever token or style URL prop changes
  useEffect(() => {
    const newMap = new mapboxgl.Map({
      container: mapContainer.current ?? "",
      style: styleUrl,
      attributionControl: false,
      transformRequest,
      accessToken: token
    });
    newMap.on("load", () => {
      setMap(newMap);
    });
    newMap.on("render", () => {
      const center = newMap.getCenter();
      setTransform({
        zoom: newMap.getZoom(),
        center: [center.lng, center.lat],
        bearing: newMap.getBearing(),
        pitch: newMap.getPitch(),
      });
    });
    return () => {
      newMap.remove()
    }
  }, [token, styleUrl, transformRequest]);

  // Keep map up to date with the props
  useDeepCompareEffectNoCheck(() => {
    if (center) {
      map?.setCenter(center);
    }
  }, [center, map]);

  useDeepCompareEffectNoCheck(() => {
    if (fitBounds) {
      map?.fitBounds(fitBounds.bounds, fitBounds.options);
    }
  }, [fitBounds, map]);

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
    if (!!touchZoomRotate) {
      map?.touchZoomRotate.enable();
      map?.touchZoomRotate.enableRotation();
      if(touchZoomRotate instanceof Object){
        if (touchZoomRotate.enableRotation){
          map?.touchZoomRotate.enableRotation();
        } else {
          map?.touchZoomRotate.disableRotation();
        }
      }
    } else {
      map?.touchZoomRotate.disable();
    }
  }, [touchZoomRotate, map]);

  const zoomControl = useRef<any>();
  useEffect(() => {
    if (showControls) {
      zoomControl.current = new ZoomControl('top-right');
      map?.addControl(zoomControl.current);
    } else {
      if (zoomControl.current) map?.removeControl(zoomControl.current);
    }
  }, [showControls, map]);

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

export default MapboxMap;
export { MapboxContext };
