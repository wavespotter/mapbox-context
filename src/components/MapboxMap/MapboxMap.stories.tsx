import React from "react";

import { Story, Meta } from "@storybook/react/types-6-0";

import MapboxMap, { MapboxMapProps } from "./";

export default {
  title: "MapboxMap",
  component: MapboxMap,
  argTypes: {
    showControls: { control: "boolean" },
  },
  args: {
    token: "pk.eyJ1Ijoiam9uc2VuIiwiYSI6IkR6UU9oMDQifQ.dymRIgqv-UV6oz0-HCFx1w",
    styleUrl: "mapbox://styles/jonsen/ckcgprwic1bxz1is2tvd560pg",
    width: "800px",
    height: "400px",
  },
} as Meta;

const Template: Story<MapboxMapProps> = (args) => <MapboxMap {...args} />;

export const Defaults = Template.bind({});
Defaults.args = {};

export const CustomCenter = Template.bind({});
CustomCenter.args = {
  center: { lat: 37, lon: -122 },
  zoom: 3,
};

export const WithControls = Template.bind({});
WithControls.args = {
  showControls: true,
};

export const InteractionsDiabled = Template.bind({});
InteractionsDiabled.args = {
  scrollZoom: false,
  dragRotate: false,
  touchZoomRotate: false,
  touchPitch: false,
};
