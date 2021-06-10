import React, { useState, useContext } from "react";

import { MapboxContext } from "../../MapboxMap";
import FillLayer, { FillLayerProps, PolygonRingCoordinates } from "../FillLayer";
import useMapLayerInteractions, {
  InteractiveLayerProps,
} from "../../../hooks/useMapInteractions";

type InteractiveFillProperties = {
  /** Flag indicating whether this fill should respond to drag events */
  draggable?: boolean;

  /** Flag indicating whether this fill should respond to click events */
  clickable?: boolean;

  /** Flag indicating whether this fill should respond to hover events */
  hoverable?: boolean;
};
export type InteractiveFillData = {
  /** Unique ID for this point that will be passed to all interaction event
   *  handlers
   */
  id: string | number;

  coordinates: PolygonRingCoordinates[];

  /** Any data you want to make available to Mapbox style functions must go
   *  in the `properties` key
   */
  properties: GeoJSON.GeoJsonProperties & InteractiveFillProperties;
};

export type InteractiveFillLayerProps = FillLayerProps &
  InteractiveLayerProps & {
    polygons:
      | InteractiveFillData[]
      | GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
  };

/** A controlled component that fires the appropriate callback for user events
 *  on an underlying fill layer. Since this is a controlled component, it does
 *  not actually manage the hover state of each fill or move fills as they
 *  are dragged— that responsibility is left up to a higher level component.
 */
const InteractiveFillLayer: React.FC<InteractiveFillLayerProps> = (props) => {
  const {
    onClick,
    onHoverEnter,
    onHoverLeave,
    onDragStart,
    onDragEnd,
    onDrag,
    eventHandlerPool,
    eventHandlerPriority,
    beforeLayer,
  } = props;

  // Flag set once the underlying fill layer has been added to the map
  const [fillLayerID, setFillLayerID] = useState<string | null>(null);
  const { map } = useContext(MapboxContext);

  // Connect event handlers to the map
  useMapLayerInteractions({
    map,
    layerID: fillLayerID,
    onClick,
    onHoverEnter,
    onHoverLeave,
    onDragStart,
    onDrag,
    onDragEnd,
    priority: eventHandlerPriority,
    eventHandlerPool,
  });

  return <FillLayer {...props} onAdd={setFillLayerID} beforeLayer={beforeLayer} />;
};

export default InteractiveFillLayer;
