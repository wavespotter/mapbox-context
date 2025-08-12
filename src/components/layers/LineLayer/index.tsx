import { featureCollection, lineString } from "@turf/helpers";
import type { Position } from "geojson";
import { LayoutSpecification, PaintSpecification } from "mapbox-gl";
import React, { useContext, useMemo, useRef } from "react";
import useMapLayer from "../../../hooks/useMapLayer";
import { MapboxContext } from "../../MapboxMap";

export type LineCoordinates = (
  | Position
  | { latitude: number; longitude: number }
)[];
export type LineLayerProps = {
  lines:
    | {
        id: string | number;
        coordinates: LineCoordinates;
        properties: GeoJSON.GeoJsonProperties;
      }[]
    | GeoJSON.FeatureCollection<
        | GeoJSON.LineString
        | GeoJSON.MultiLineString
        | GeoJSON.Polygon
        | GeoJSON.MultiPolygon
      >;

  style: {
    layout: LayoutSpecification;
    paint: PaintSpecification;
  };

  /** Callback fired after the layer has been added to the map. Useful if you
   *  want to register event handlers after the layer is ready.
   */
  onAdd?: (layerName: string) => void;

  id?: string;
  beforeLayer?: string;
};

// Used to generate unique layer and source IDs if one is not provided
let idIncrement = 0;

const LineLayer: React.FC<LineLayerProps> = ({
  lines,
  style,
  onAdd,
  id: _id,
  beforeLayer,
}) => {
  const id = useRef(`line-layer-${++idIncrement}`);
  if (_id) id.current = _id;

  const { map } = useContext(MapboxContext);

  // Create a geojson object for the source data
  const geojson = useMemo(
    () =>
      "type" in lines
        ? lines
        : featureCollection(
            lines.map((p) =>
              lineString(
                p.coordinates.map((c) =>
                  "longitude" in c ? [c.longitude, c.latitude] : c
                ),
                {
                  ...p.properties,
                  id: p.id,
                }
              )
            )
          ),
    [lines]
  );

  // This hook handles creating and updating layers on the Mapbox map for us
  useMapLayer(map, id.current, "line", geojson, style, onAdd, beforeLayer);

  // No DOM output
  return null;
};

export default LineLayer;
