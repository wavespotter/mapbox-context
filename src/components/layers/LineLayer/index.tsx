import React, { useContext, useRef, useMemo } from "react";
import { MapboxContext } from "../../MapboxMap";
import { featureCollection, lineString, Position } from "@turf/helpers";
import useMapLayer from "../../../hooks/useMapLayer";

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
    | GeoJSON.FeatureCollection<GeoJSON.LineString | GeoJSON.MultiLineString>;

  style: {
    layout: mapboxgl.LineLayout;
    paint: mapboxgl.LinePaint;
  };

  /** Callback fired after the layer has been added to the map. Useful if you
   *  want to register event handlers after the layer is ready.
   */
  onAdd?: (layerName: string) => void;

  id?: string;
};

// Used to generate unique layer and source IDs if one is not provided
let idIncrement = 0;

const LineLayer: React.FC<LineLayerProps> = ({
  lines,
  style,
  onAdd,
  id: _id,
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
  useMapLayer(map, id.current, "line", geojson, style, onAdd);

  // No DOM output
  return null;
};

export default LineLayer;
