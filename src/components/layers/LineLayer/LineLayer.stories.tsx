import React from "react";

import { Story, Meta } from "@storybook/react/types-6-0";

import LineLayer, { LineLayerProps } from ".";
import MapDecorator from "../../../storybook-helpers/map-decorator";
export default {
  title: "Line layer",
  component: LineLayer,
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
  layout: mapboxgl.LineLayout;
  paint: mapboxgl.LinePaint;
} = {
  layout: {},
  paint: {
    "line-color": ["get", "color"],
    "line-width": 4,
  },
};

const Template: Story<LineLayerProps> = (args) => <LineLayer {...args} />;

export const SingleLine = Template.bind({});
SingleLine.args = {
  lines: mockLines.slice(0, 1),
  style: lineStyle,
};

export const MultipleLines = Template.bind({});
MultipleLines.args = {
  lines: mockLines,
  style: lineStyle,
};
