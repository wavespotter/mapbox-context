import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useContext,
} from "react";

import { Story, Meta } from "@storybook/react/types-6-0";

import InteractivePointLayer, {
  InteractivePointLayerProps,
  InteractivePointData,
} from ".";
import MapDecorator from "../../../storybook-helpers/map-decorator";

import spotterImg from "../../../storybook-helpers/assets/spotter.png";
import { MapboxMapContext } from "../../..";
import PointLayer from "../PointLayer";

export default {
  title: "Interactive Point Layer",
  component: InteractivePointLayer,
  argTypes: {},
  args: {},
  decorators: [MapDecorator()],
} as Meta;

const mockPoints = [
  { id: "A", latitude: -10, longitude: -10 },
  { id: "B", latitude: -10, longitude: -5 },
  { id: "C", latitude: -5, longitude: -10 },
  { id: "D", latitude: -5, longitude: -5 },
  { id: "E", latitude: 0, longitude: 0 },
];
const bigMockPointsList = [];
for (let i = -180; i < 180; i += 5) {
  for (let j = -90; j < 90; j += 5) {
    bigMockPointsList.push({ id: `${i}-${j}`, latitude: j, longitude: i });
  }
}

const circleStyle: {
  layout: mapboxgl.CircleLayout;
  paint: mapboxgl.CirclePaint;
} = {
  layout: {},
  paint: {
    "circle-radius": 10,
    "circle-color": ["case", ["get", "selected"], "#000000", "#AAAAAA"],
    "circle-stroke-width": 4,
    "circle-stroke-color": "#000000",
    "circle-stroke-opacity": ["case", ["get", "hovering"], 1, 0],
  },
};

// Big transparent circles to increase the touch area of points
const bigTransparentCircleStyle: {
  layout: mapboxgl.CircleLayout;
  paint: mapboxgl.CirclePaint;
} = {
  layout: {},
  paint: {
    "circle-radius": 40,
    "circle-opacity": 0,
  },
};

const InteractivePointsStateManager: Story<
  InteractivePointLayerProps & {
    points: InteractivePointData[];
    draggable: boolean;
    withBigTouchZones: boolean;
  }
> = (props) => {
  const { map } = useContext(MapboxMapContext);
  const [points, setPoints] = useState(
    props.points.map((p) => ({
      ...p,
      clickable: true,
      hoverable: true,
      draggable: props.draggable ?? false,
      // TODO: The layers could be re-written to use Mapbox `featureState`
      // instead of setting GeoJSON properties
      // See: https://docs.mapbox.com/mapbox-gl-js/api/map/#map#setfeaturestate
      properties: { selected: false, hovering: false },
    }))
  );

  const handleDragStart = useCallback(
    (
      id: string | number,
      offset: mapboxgl.Point,
      e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent
    ) => {},
    []
  );
  const handleDragEnd = useCallback(() => {}, []);
  const handleDrag = useCallback(
    (
      id: string | number,
      offset: mapboxgl.Point,
      e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent
    ) => {
      if (!map) return;

      // Move the point to the current pointer position minus the captured offset
      const pointerProjected = map.project(e.lngLat);
      const offsetLngLat = map.unproject(pointerProjected.sub(offset));
      setPoints((_points) =>
        _points.map((p) =>
          p.id !== id
            ? p
            : { ...p, latitude: offsetLngLat.lat, longitude: offsetLngLat.lng }
        )
      );
    },
    [map]
  );

  const handleClick = useCallback((id: string | number) => {
    setPoints((old) =>
      old.map((o) =>
        o.id === id
          ? {
              ...o,
              properties: { ...o.properties, selected: !o.properties.selected },
            }
          : o
      )
    );
  }, []);

  const handleHoverEnter = useCallback((id: string | number) => {
    setPoints((old) =>
      old.map((o) =>
        o.id === id
          ? {
              ...o,
              properties: { ...o.properties, hovering: true },
            }
          : o
      )
    );
  }, []);

  const handleHoverLeave = useCallback((id: string | number) => {
    setPoints((old) =>
      old.map((o) =>
        o.id === id
          ? {
              ...o,
              properties: { ...o.properties, hovering: false },
            }
          : o
      )
    );
  }, []);

  return props.withBigTouchZones ? (
    <>
      <PointLayer type="circle" points={points} style={circleStyle} />
      <InteractivePointLayer
        type="circle"
        points={points}
        style={bigTransparentCircleStyle}
        onClick={handleClick}
        onHoverEnter={handleHoverEnter}
        onHoverLeave={handleHoverLeave}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      />
    </>
  ) : (
    <InteractivePointLayer
      type="circle"
      points={points}
      style={circleStyle}
      onClick={handleClick}
      onHoverEnter={handleHoverEnter}
      onHoverLeave={handleHoverLeave}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    />
  );
};

export const AFewPoints = InteractivePointsStateManager.bind({});
AFewPoints.args = {
  points: mockPoints,
};

export const ManyPoints = InteractivePointsStateManager.bind({});
ManyPoints.args = {
  points: bigMockPointsList,
};

export const DraggablePoints = InteractivePointsStateManager.bind({});
DraggablePoints.args = {
  draggable: true,
  points: mockPoints,
};

export const DraggablePointsStressTest = InteractivePointsStateManager.bind({});
DraggablePointsStressTest.args = {
  draggable: true,
  points: bigMockPointsList,
};

export const WithLargeInteractionZone = InteractivePointsStateManager.bind({});
WithLargeInteractionZone.args = {
  draggable: true,
  points: mockPoints,
  withBigTouchZones: true,
};
