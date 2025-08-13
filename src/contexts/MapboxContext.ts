import mapboxgl from "mapbox-gl";
import React from "react";

interface MapboxContextType {
  map: mapboxgl.Map | null;
  width: number;
  height: number;

  transform: MapboxMapTransform | null;
}

export interface MapboxMapTransform {
  zoom: number;
  center: [number, number];
  bearing: number;
  pitch: number;
}

const MapboxContext = React.createContext<MapboxContextType>({
  map: null,
  width: 0,
  height: 0,
  transform: null,
});

export default MapboxContext;
