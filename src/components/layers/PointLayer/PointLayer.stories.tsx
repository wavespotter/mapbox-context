import React, { useEffect, useState } from "react";

import { Meta, StoryFn } from "@storybook/react/types-6-0";

import PointLayer, { PointLayerProps } from ".";
import MapDecorator from "../../../storybook-helpers/map-decorator";

import { CircleLayerSpecification, SymbolLayerSpecification } from "mapbox-gl";
import spotterImg from "../../../storybook-helpers/assets/spotter.png";

export default {
  title: "Point layer",
  component: PointLayer,
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
  layout: NonNullable<CircleLayerSpecification["layout"]>;
  paint: NonNullable<CircleLayerSpecification["paint"]>;
} = {
  layout: {},
  paint: {
    "circle-radius": 5,
    "circle-color": "#000000",
  },
};

const symbolStyle: {
  layout: NonNullable<SymbolLayerSpecification["layout"]>;
  paint: NonNullable<SymbolLayerSpecification["paint"]>;
} = {
  layout: {
    "icon-allow-overlap": true,
    "icon-image": "spotter",
    "icon-size": 0.25,
    "text-anchor": "top",
    "text-offset": [0, 1],
  },
  paint: {},
};

const Template: StoryFn<PointLayerProps> = (
  args: JSX.IntrinsicAttributes &
    PointLayerProps & { children?: React.ReactNode }
) => <PointLayer {...args} />;

export const Circles = Template.bind({});
Circles.args = {
  type: "circle",
  points: mockPoints,
  style: circleStyle
};

export const Symbols = Template.bind({});
Symbols.args = {
  type: "symbol",
  points: mockPoints,
  style: symbolStyle,
  symbolImages: [{ name: "spotter", url: spotterImg }],
};

export const ManyPoints = Template.bind({});

ManyPoints.args = {
  type: "circle",
  points: bigMockPointsList,
  style: circleStyle,
};

export const Animated: StoryFn<PointLayerProps> = () => {
  const [points, setPoints] = useState(mockPoints);
  useEffect(() => {
    let rafID = 0;
    const raf = (time: number) => {
      setPoints(
        mockPoints.map((p, i) => ({
          ...p,
          latitude: p.latitude + i * Math.cos(time / 1000 + i * 10),
          longitude: p.longitude + i * Math.sin(time / 1000 + i * 30),
        }))
      );
      rafID = requestAnimationFrame(raf);
    };
    rafID = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafID);
    };
  }, []);

  return <PointLayer type="circle" points={points} style={circleStyle} />;
};
