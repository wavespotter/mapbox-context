import React, { useContext, useRef, useMemo } from "react";
import { MapboxContext } from "../../MapboxMap";
import { featureCollection, point } from "@turf/helpers";
import useImageLoader from "../../../hooks/use-image-loader";
import useMapLayer from "../../../hooks/useMapLayer";

export type PointLayerProps = {
  points: {
    id: string | number;
    latitude: number;
    longitude: number;
    properties?: GeoJSON.GeoJsonProperties;
  }[];

  type: "circle" | "symbol";
  style: {
    layout: mapboxgl.CircleLayout | mapboxgl.SymbolLayout;
    paint: mapboxgl.CirclePaint | mapboxgl.SymbolPaint;
  };

  /** An optional list of images to load for use in symbol layers. Each object
   *  in this array should contain a `url` to fetch the image along with a
   *  `name` property that can later be referenced in the symbol layer's style
   *  definition.
   *
   *  The `name` property must be unique across all symbols used on the same
   *  Mapbox map.
   */
  symbolImages?: { url: string; name: string }[];

  /** Callback fired after the layer has been added to the map. Useful if you
   *  want to register event handlers after the layer is ready.
   */
  onAdd?: (layerName: string) => void;

  id?: string;
  beforeLayer?: string;
};

// Used to generate unique layer and source IDs if one is not provided
let idIncrement = 0;

const PointLayer: React.FC<PointLayerProps> = ({
  points,
  style,
  type,
  onAdd,
  symbolImages,
  id: _id,
  beforeLayer,
}) => {
  const id = useRef(`point-layer-${++idIncrement}`);
  if (_id) id.current = _id;

  const { map } = useContext(MapboxContext);

  // Load images for symbol layers if necessary
  useImageLoader(map, symbolImages);

  // Create a geojson object for the source data
  const geojson = useMemo(
    () =>
      featureCollection(
        points.map((p) =>
          point([p.longitude, p.latitude], { ...p.properties, id: p.id })
        )
      ),
    [points]
  );

  // This hook handles creating and updating layers on the Mapbox map for us
  useMapLayer(map, id.current, type, geojson, style, onAdd, beforeLayer);

  // No DOM output
  return null;
};

export default PointLayer;
