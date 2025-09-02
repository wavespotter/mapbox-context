import React, { useContext, useState } from "react";

import useMapLayerInteractions, {
  InteractiveLayerProps,
} from "../../../hooks/useMapInteractions";
import { MapboxContext } from "../../MapboxMap";
import PointLayer, { PointLayerProps } from "../PointLayer";

export interface InteractivePointData {
  /** Unique ID for this point that will be passed to all interaction event
   *  handlers
   */
  id: string | number;

  /** Latitude position of this point */
  latitude: number;
  /** Longitude position of this point */
  longitude: number;

  /** Any data you want to make available to Mapbox style functions must go
   *  in the `properties` key
   */
  properties: GeoJSON.GeoJsonProperties & {
    /** Flag indicating whether this point should respond to drag events */
    draggable?: boolean;

    /** Flag indicating whether this point should respond to click events */
    clickable?: boolean;

    /** Flag indicating whether this point should respond to hover events */
    hoverable?: boolean;
  };
}

export type InteractivePointLayerProps = PointLayerProps &
  InteractiveLayerProps & {
    points: InteractivePointData[];
  };

/** A controlled component that fires the appropriate callback for user events
 *  on an underlying point layer. Since this is a controlled component, it does
 *  not actually manage the hover state of each point or move points as they
 *  are dragged— that responsibility is left up to a higher level component.
 */
const InteractivePointLayer = (props: InteractivePointLayerProps) => {
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

  // Flag set once the underlying point layer has been added to the map
  const [pointLayerID, setPointLayerID] = useState<string | null>(null);
  const { map } = useContext(MapboxContext);

  // Connect event handlers to the map
  useMapLayerInteractions({
    map,
    layerID: pointLayerID,
    onClick,
    onHoverEnter,
    onHoverLeave,
    onDragStart,
    onDrag,
    onDragEnd,
    priority: eventHandlerPriority,
    eventHandlerPool,
  });

  return (
    <PointLayer {...props} onAdd={setPointLayerID} beforeLayer={beforeLayer} />
  );
};

export default InteractivePointLayer;
