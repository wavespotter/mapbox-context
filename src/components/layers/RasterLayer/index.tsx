import {
  LayoutSpecification,
  PaintSpecification,
  SourceSpecification,
} from "mapbox-gl";
import { useContext, useEffect } from "react";
import useDeepCompareEffect from "use-deep-compare-effect";
import MapboxContext from "../../../contexts/MapboxContext";

interface RasterLayerProps {
  sourceOptions: SourceSpecification;
  minzoom?: number;
  maxzoom?: number;
  id: string;
  layoutOptions?: LayoutSpecification;
  paintOptions?: PaintSpecification;
  beforeLayer?: string;
  opacity?: number;
}

const RasterLayer = ({
  sourceOptions,
  layoutOptions,
  paintOptions,
  id,
  minzoom = 0,
  maxzoom = 22,
  beforeLayer,
  opacity = 1,
}: RasterLayerProps) => {
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
      } catch (e) {
        console.warn("Error removing Raster layer:", e);
      }
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
