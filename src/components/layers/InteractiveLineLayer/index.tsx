import React, { useState, useContext } from "react";

import { MapboxContext } from "../../MapboxMap";
import LineLayer, { LineLayerProps, LineCoordinates } from "../LineLayer";
import useMapLayerInteractions, {
  InteractiveLayerProps,
} from "../../../hooks/useMapInteractions";

type InteractiveLineProperties = {
  /** Flag indicating whether this line should respond to drag events */
  draggable?: boolean;

  /** Flag indicating whether this line should respond to click events */
  clickable?: boolean;

  /** Flag indicating whether this line should respond to hover events */
  hoverable?: boolean;
};
export type InteractiveLineData = {
  /** Unique ID for this line that will be passed to all interaction event
   *  handlers
   */
  id: string | number;

  coordinates: LineCoordinates;

  /** Any data you want to make available to Mapbox style functions must go
   *  in the `properties` key
   */
  properties: GeoJSON.GeoJsonProperties & InteractiveLineProperties;
};

export type InteractiveLineLayerProps = LineLayerProps &
  InteractiveLayerProps & {
    lines:
      | InteractiveLineData[]
      | GeoJSON.FeatureCollection<
          GeoJSON.LineString | GeoJSON.MultiLineString,
          InteractiveLineProperties
        >;
  };

/** A controlled component that fires the appropriate callback for user events
 *  on an underlying line layer. Since this is a controlled component, it does
 *  not actually manage the hover state of each line or move lines as they
 *  are dragged— that responsibility is left up to a higher level component.
 */
const InteractiveLineLayer: React.FC<InteractiveLineLayerProps> = (props) => {
  const {
    onClick,
    onHoverEnter,
    onHoverLeave,
    onDragStart,
    onDragEnd,
    onDrag,
    eventHandlerPool,
    eventHandlerPriority,
  } = props;

  // Flag set once the underlying line layer has been added to the map
  const [lineLayerID, setLineLayerID] = useState<string | null>(null);
  const { map } = useContext(MapboxContext);

  // Connect event handlers to the map
  useMapLayerInteractions({
    map,
    layerID: lineLayerID,
    onClick,
    onHoverEnter,
    onHoverLeave,
    onDragStart,
    onDrag,
    onDragEnd,
    priority: eventHandlerPriority,
    eventHandlerPool,
  });

  return <LineLayer {...props} onAdd={setLineLayerID} />;
};

export default InteractiveLineLayer;
