import React, { useContext, useRef, useMemo } from "react";
import { MapboxContext } from "../../MapboxMap";
import { featureCollection, polygon, Position } from "@turf/helpers";
import useMapLayer from "../../../hooks/useMapLayer";

export type PolygonRingCoordinates = (
  | Position
  | { latitude: number; longitude: number }
)[];
export type FillLayerProps = {
  polygons:
    | {
        id: string | number;
        coordinates: PolygonRingCoordinates[];
        properties: GeoJSON.GeoJsonProperties;
      }[]
    | GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>;

  style: {
    layout: mapboxgl.FillLayout;
    paint: mapboxgl.FillPaint;
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

const FillLayer: React.FC<FillLayerProps> = ({
  polygons,
  style,
  onAdd,
  id: _id,
  beforeLayer,
}) => {
  const id = useRef(`fill-layer-${++idIncrement}`);
  if (_id) id.current = _id;

  const { map } = useContext(MapboxContext);

  // Create a geojson object for the source data
  const geojson = useMemo(
    () =>
      "type" in polygons
        ? polygons
        : featureCollection(
            polygons.map((p) =>
              polygon(
                p.coordinates.map((ring) =>
                  ring.map((c) =>
                    "longitude" in c ? [c.longitude, c.latitude] : c
                  )
                ),
                {
                  ...p.properties,
                  id: p.id,
                }
              )
            )
          ),
    [polygons]
  );

  // This hook handles creating and updating layers on the Mapbox map for us
  useMapLayer(map, id.current, "fill", geojson, style, onAdd, beforeLayer);

  // No DOM output
  return null;
};

export default FillLayer;
