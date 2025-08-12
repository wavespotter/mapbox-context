import React, { useState, useCallback, useContext } from "react";

import { StoryFn, Meta } from "@storybook/react/types-6-0";

import InteractiveLineLayer, {
  InteractiveLineLayerProps,
  InteractiveLineData,
} from ".";
import MapDecorator from "../../../storybook-helpers/map-decorator";

import { MapboxMapContext } from "../../..";
import LineLayer from "../LineLayer";

export default {
  title: "Interactive Line Layer",
  component: InteractiveLineLayer,
  argTypes: {},
  args: {},
  decorators: [MapDecorator()],
} as Meta;

const mockLines = [
  {
    id: "A",
    coordinates: [
      [-27, -6],
      [-21, 0],
      [-15, -8],
      [-9, -0],
      [-3, -8],
      [1, -1],
      [8, -8],
    ],
    properties: {
      color: "#ff55ff",
    },
  },
  {
    id: "B",
    coordinates: [
      [-22.4, 27.7],
      [-26.2, 21.8],
      [-27.8, 18.3],
      [-27.9, 13.7],
      [-26.2, 9.5],
      [-22.7, 6.5],
      [-18.7, 4.3],
      [-14.2, 3.4],
      [-9.8, 1.6],
      [-8.8, -1.7],
      [-9.8, -4.7],
      [-10.6, -8.8],
      [-13.2, -14],
      [-17.9, -20.2],
      [-17.7, -23.3],
      [-15.3, -25.3],
      [-9.4, -28.4],
      [-6.1, -29.5],
      [-1.1, -30.8],
      [4.6, -31.2],
      [8, -30.3],
    ],
    properties: {
      color: "#55FF55",
    },
  },
  {
    id: "C",
    coordinates: [
      [-29.1, 5.2],
      [-31.2, 2.3],
      [-31.6, -2.8],
      [-28.1, -4],
      [-21.6, -4.2],
      [-19.7, -0.9],
      [-20, 1.9],
      [-23.4, 3.8],
      [-25.1, 3.8],
      [-28.3, 2],
      [-28.2, -1],
      [-26.9, -2.2],
      [-23.7, -2],
      [-22.1, -0.6],
      [-22.5, 0.8],
      [-24.2, 1.9],
      [-25.1, 1.5],
      [-25.8, -0.2],
      [-24.8, -0.4],
      [-23.9, 0.2],
    ],
    properties: {
      color: "#00DDDD",
    },
  },
];
const lineStyle: {
  layout: mapboxgl.LayoutSpecification;
  paint: mapboxgl.PaintSpecification;
} = {
  layout: {},
  paint: {
    "line-opacity": ["case", ["get", "selected"], 1, 0.5],
    "line-color": ["get", "color"],
    "line-width": ["case", ["get", "hovering"], 8, 4],
  },
};
// Big transparent lines to increase the touch area of lines
const bigTransparentLineStyle: {
  layout: mapboxgl.LayoutSpecification;
  paint: mapboxgl.PaintSpecification;
} = {
  layout: {},
  paint: {
    "line-color": "rgba(0,0,0,0)",
    "line-width": 40,
  },
};

const InteractiveLinesStateManager: StoryFn<
  InteractiveLineLayerProps & {
    lines: InteractiveLineData[];
    withBigTouchZones: boolean;
  }
> = (props: any) => {
  const { map } = useContext(MapboxMapContext);
  const [lines, setLines] = useState(
    props.lines.map((p: { properties: any; id: any; }) => ({
      ...p,
      properties: {
        ...p.properties,
        id: p.id,
        selected: false,
        hovering: false,
        clickable: true,
        hoverable: true,
        draggable: false,
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
      setLines((_lines: any[]) =>
        _lines.map((p: { id: string | number; }) => (p.id !== id ? p : { ...p, ...newLocation }))
      );
    },
    [map]
  );

  const handleClick = useCallback((id: string | number) => {
    setLines((old: any[]) =>
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
    setLines((old: any[]) =>
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
    setLines((old: any[]) =>
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
      <LineLayer lines={lines} style={lineStyle} />
      <InteractiveLineLayer
        lines={lines}
        style={bigTransparentLineStyle}
        onClick={handleClick}
        onHoverEnter={handleHoverEnter}
        onHoverLeave={handleHoverLeave}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      />
    </>
  ) : (
    <InteractiveLineLayer
      lines={lines}
      style={lineStyle}
      onClick={handleClick}
      onHoverEnter={handleHoverEnter}
      onHoverLeave={handleHoverLeave}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    />
  );
};

export const AFewLines = InteractiveLinesStateManager.bind({});
AFewLines.args = {
  lines: mockLines,
};

export const WithLargeInteractionZone = InteractiveLinesStateManager.bind({});
WithLargeInteractionZone.args = {
  lines: mockLines,
  withBigTouchZones: true,
};
