import React, { useEffect, useContext } from "react";
import { CustomLayerInterface } from "mapbox-gl";

import MapboxContext from "../../../contexts/MapboxContext";

interface CustomLayerProps {
  renderer: CustomLayerInterface;
  beforeLayer?: string;
}

const CustomLayer: React.FC<CustomLayerProps> = ({ renderer, beforeLayer }) => {
  const { map } = useContext(MapboxContext);
  useEffect(() => {
    if (map === null) return;

    map.addLayer(renderer, beforeLayer);
    const id = renderer.id;
    return () => {
      try {
        map.removeLayer(id);
      } catch (e) {
        console.warn("Error removing custom layer:", e);
      }
    };
  }, [renderer, beforeLayer, map]);

  return null;
};

export default CustomLayer;
