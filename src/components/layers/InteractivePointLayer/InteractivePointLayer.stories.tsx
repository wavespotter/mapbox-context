import React, { useState, useCallback, useContext } from "react";

import { StoryFn, Meta } from "@storybook/react/types-6-0";

import InteractivePointLayer, {
  InteractivePointLayerProps,
  InteractivePointData,
} from ".";
import MapDecorator from "../../../storybook-helpers/map-decorator";

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
  { id: "A", latitude: -10, longitude: -10, properties: {} },
  { id: "B", latitude: -10, longitude: -5, properties: {} },
  { id: "C", latitude: -5, longitude: -10, properties: {} },
  { id: "D", latitude: -5, longitude: -5, properties: {} },
  { id: "E", latitude: 0, longitude: 0, properties: {} },
];

const mockPointsB = [
  { id: "F", latitude: -10.5, longitude: -10.5, properties: {} },
  { id: "G", latitude: -10.5, longitude: -5.5, properties: {} },
  { id: "H", latitude: -5.5, longitude: -10, properties: {} },
  { id: "I", latitude: -5.5, longitude: -5, properties: {} },
  { id: "J", latitude: 0.5, longitude: 0.5, properties: {} },
];
const bigMockPointsList = [];
for (let i = -180; i < 180; i += 5) {
  for (let j = -90; j < 90; j += 5) {
    bigMockPointsList.push({
      id: `${i}-${j}`,
      latitude: j,
      longitude: i,
      properties: {},
    });
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

const InteractivePointsStateManager: StoryFn<
  InteractivePointLayerProps & {
    points: InteractivePointData[];
    draggable: boolean;
    withBigTouchZones: boolean;
  }
> = (props: any) => {
  const { map } = useContext(MapboxMapContext);
  const [points, setPoints] = useState(
    props.points.map((p: InteractivePointData) => ({
      ...p,
      properties: {
        id: p.id,
        selected: false,
        hovering: false,
        clickable: true,
        hoverable: true,
        draggable: props.draggable ?? false,
      },
    }))
  );

  const handleDragStart = useCallback(() => {}, []);
  const handleDragEnd = useCallback(() => {}, []);
  const handleDrag = useCallback(
    (
      id: string | number,
      newLocation: { latitude: number; longitude: number }
    ) => {
      if (!map) return;

      // Move the point to the current pointer position
      setPoints((_points: any[]) =>
        _points.map((p) => (p.id !== id ? p : { ...p, ...newLocation }))
      );
    },
    [map]
  );

  const handleClick = useCallback((id: string | number) => {
    setPoints((old: any[]) =>
      old.map((o: { id: string | number; properties: { selected: any; }; }) =>
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
    setPoints((old: any[]) =>
      old.map((o: { id: string | number; properties: any; }) =>
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
    setPoints((old: any[]) =>
      old.map((o: { id: string | number; properties: any; }) =>
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

const Component = InteractivePointsStateManager as any;
export const OverlappingLayers = () => (
  <>
    <Component points={mockPoints} />
    <Component points={mockPointsB} priority={0} />
  </>
);

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
