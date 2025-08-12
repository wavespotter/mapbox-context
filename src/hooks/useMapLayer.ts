import { Map, LayoutSpecification, PaintSpecification } from "mapbox-gl";
import { useEffect } from "react";
import useDeepCompareEffect from "use-deep-compare-effect";

type GeoJSONSourceDataType =
  | GeoJSON.Feature<GeoJSON.Geometry>
  | GeoJSON.FeatureCollection<GeoJSON.Geometry>
  | String;

const useMapLayer = <
  TLayout extends LayoutSpecification = LayoutSpecification,
  TPaint extends PaintSpecification = PaintSpecification
>(
  map: Map | null,
  id: string,
  type: any,
  geojson: GeoJSONSourceDataType,
  style: { layout: TLayout; paint: TPaint },
  onAdd?: (id: string) => void,
  beforeLayer?: string
) => {
  useEffect(() => {
    if (!map) return;
    // Start with a blank source — data will be added below via the
    // `useMapSourceGeoJSON` hook
    map.addSource(id, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    map.addLayer({
      id: id,
      paint: style.paint,
      layout: style.layout,
      source: id,
      type,
      
    }, beforeLayer);

    onAdd?.(id);

    return () => {
      try {
        map.removeLayer(id);
        map.removeSource(id);
      } catch (e) {
        // Map was already un-mounted;
      }
    };
    // Ignore changes to style — they will be updated separately via the
    // `useMapLayerStyle` hook
    // eslint-disable-next-line
  }, [map, id, type]);

  // Synchronize style state
  useMapLayerStyle(map, id, style);

  // Synchronize GeoJSON data source state
  useMapSourceGeoJSON(map, id, geojson);
};

/** Synchronize a Mapbox layer's style with a style object passed down through
 *  props.
 */
const useMapLayerStyle = (
  map: Map | null,
  layerID: string,
  style: { layout: LayoutSpecification; paint: PaintSpecification }
) => {
  // Update style whenever it changes
  useDeepCompareEffect(() => {
    if (!map) return;
    // Copy over paint and layout properties one by one because that's the way
    // Mapbox rolls.
    for (const prop in style.paint) {
      map.setPaintProperty(
        layerID,
        prop as keyof PaintSpecification,
        style.paint[prop as keyof typeof style.paint]
      );
    }
    for (const prop in style.layout) {
      map.setLayoutProperty(
        layerID,
        prop as keyof LayoutSpecification,
        style.layout[prop as keyof typeof style.layout]
      );
    }
  }, [map, layerID, style]);
};

/** Synchronize a Mapbox layer's data with a GeoJSON object passed down */
const useMapSourceGeoJSON = (
  map: Map | null,
  id: string,
  geojson: GeoJSONSourceDataType
) => {
  // Set data on initial load and whenever it changes
  useEffect(() => {
    if (!map) return;

    const source = map.getSource(id);
    if (source?.type !== "geojson") {
      console.warn("Source should be geojson. Cannot set data.");
    } else {
      // TODO: Unsure of this one
      // Ensure geojson is a native string or a valid GeoJSON object
      const data =
        typeof geojson === "string"
          ? geojson
          : geojson instanceof String
          ? geojson.toString()
          : geojson;
      source.setData(data);
    }
  }, [map, id, geojson]);
};

export default useMapLayer;
