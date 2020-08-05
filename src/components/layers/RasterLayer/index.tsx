import React, { useEffect, useContext } from "react";
import MapboxContext from "../../../contexts/MapboxContext";
import useDeepCompareEffect from "use-deep-compare-effect";

const RasterLayer: React.FC<{
  sourceOptions: mapboxgl.RasterSource | mapboxgl.ImageSourceRaw;
  minzoom?: number;
  maxzoom?: number;
  id: string;
  layoutOptions?: mapboxgl.RasterLayout;
  paintOptions?: mapboxgl.RasterPaint;
  beforeLayer?: string;
  opacity?: number;
}> = ({
  sourceOptions,
  layoutOptions,
  paintOptions,
  id,
  minzoom = 0,
  maxzoom = 22,
  beforeLayer,
  opacity = 1,
}) => {
  const { map } = useContext(MapboxContext);

  useDeepCompareEffect(() => {
    if (!map) return;

    // For now raster layers are immutable— will be removed/re-added if
    // any props change
    map.addSource(id, sourceOptions);
    map.addLayer(
      {
        id,
        source: id,
        type: "raster",
        minzoom,
        maxzoom,
        paint:
          opacity !== undefined
            ? { ...(paintOptions ?? {}), "raster-opacity": opacity }
            : paintOptions ?? {},
        layout: layoutOptions ?? {},
      },
      beforeLayer
    );

    return () => {
      try {
        map.removeLayer(id);
        map.removeSource(id);
      } catch (e) {}
    };
  }, [
    sourceOptions,
    layoutOptions,
    minzoom,
    maxzoom,
    paintOptions,
    map,
    id,
    beforeLayer,
  ]);

  useEffect(() => {
    if (!map) return;
    map.setPaintProperty(id, "raster-opacity", opacity);
  }, [map, opacity, id]);
  return null;
};

export default RasterLayer;
