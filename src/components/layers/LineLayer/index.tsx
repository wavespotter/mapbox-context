import React, { useEffect, useContext } from "react";
import MapboxContext from "../../../contexts/MapboxContext";

const LineLayer: React.FC<{
  line: GeoJSON.Feature | GeoJSON.FeatureCollection;
  color?: string;
  width?: number;
  id?: string;
}> = ({ line, color = "white", width = 1, id = "line" }) => {
  const { map } = useContext(MapboxContext);

  useEffect(() => {
    if (!map) return;
    const source = map.getSource(id);
    if (source && source.type === "geojson") {
      source.setData(line);
    } else {
      map.addSource(id, { type: "geojson", data: line });
      map.addLayer({
        id,
        source: id,
        type: "line",
        paint: {
          "line-color": color,
          "line-width": width,
        },
      });
    }
    return () => {
      map.removeLayer(id);
      map.removeSource(id);
    };
  }, [line, map, id, width, color]);
  return null;
};

export default LineLayer;
