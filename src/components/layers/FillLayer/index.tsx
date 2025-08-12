import { featureCollection, polygon } from "@turf/helpers";
import type { Position } from "geojson";
import { LayoutSpecification, PaintSpecification } from "mapbox-gl";
import React, { useContext, useMemo, useRef } from "react";
import useImageLoader from "../../../hooks/use-image-loader";
import useMapLayer from "../../../hooks/useMapLayer";
import { MapboxContext } from "../../MapboxMap";

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
    layout: LayoutSpecification;
    paint: PaintSpecification;
  };

  /** An optional list of images to load for use in fill layers. Each object
   *  in this array should contain a `url` to fetch the image along with a
   *  `name` property that can later be referenced in the fill layer's style
   *  definition.
   *
   *  The `name` property must be unique across all images used on the same
   *  Mapbox map.
   */
  images?: { url: string; name: string }[];

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
  images,
  onAdd,
  id: _id,
  beforeLayer,
}) => {
  const id = useRef(`fill-layer-${++idIncrement}`);
  if (_id) id.current = _id;

  const { map } = useContext(MapboxContext);

  // Load images for fill layers if necessary
  const { loadingComplete } = useImageLoader(map, images);

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
  useMapLayer(
    map,
    id.current,
    "fill",
    loadingComplete
      ? geojson
      : {
          type: "FeatureCollection",
          features: [],
        },
    loadingComplete ? style : { layout: {}, paint: {} },
    onAdd,
    beforeLayer
  );

  // No DOM output
  return null;
};

export default FillLayer;
