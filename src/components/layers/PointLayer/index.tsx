import React, { useContext, useEffect, useRef } from "react";
import { MapboxContext } from "../../MapboxMap";
import { featureCollection, point } from "@turf/helpers";
import useDeepCompareEffect from "use-deep-compare-effect";
import useSymbolImageLoader from "./use-symbol-image-loader";

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
}) => {
  const id = useRef(`point-layer-${++idIncrement}`);
  if (_id) id.current = _id;

  const { map } = useContext(MapboxContext);

  useSymbolImageLoader(map, symbolImages);

  useEffect(() => {
    if (!map) return;
    // Start with a blank source
    map.addSource(id.current, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    map.addLayer({
      id: id.current,
      paint: style.paint,
      layout: style.layout,
      source: id.current,
      type,
    });

    onAdd?.(id.current);

    return () => {
      try {
        map.removeLayer(id.current);
        map.removeSource(id.current);
      } catch (e) {
        // Map was already un-mounted;
      }
    };
    // Ignore changes to style — they will be updated separately next
    // eslint-disable-next-line
  }, [map, id, type]);

  // Update style whenever it changes
  useDeepCompareEffect(() => {
    if (!map) return;
    // Copy over paint and layout properties one by one because that's the way
    // Mapbox rolls.
    for (const prop in style.paint) {
      map.setPaintProperty(
        id.current,
        prop,
        style.paint[prop as keyof typeof style.paint]
      );
    }
    for (const prop in style.layout) {
      map.setLayoutProperty(
        id.current,
        prop,
        style.layout[prop as keyof typeof style.layout]
      );
    }
  }, [map, style]);

  // Set data on initial load and whenever it changes
  useEffect(() => {
    if (!map) return;
    // Create GeoJSON object
    const geojson = featureCollection(
      points.map((p) =>
        point([p.longitude, p.latitude], { ...p.properties, id: p.id })
      )
    );

    const source = map?.getSource(id.current);
    if (source?.type !== "geojson") {
      console.warn("Source should be geojson. Cannot set data.");
    } else {
      source.setData(geojson);
    }
  }, [map, points]);
  return null;
};

export default PointLayer;
