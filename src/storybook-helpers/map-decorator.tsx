import { Decorator } from "@storybook/react";
import React from "react";
import MapboxMap from "../components/MapboxMap";

export default ({
    width = "800px",
    height = "400px",
    zoom = 2,
    center = { lat: 0, lng: 0 },
  } = {}): Decorator =>
  (Story) => (
    <MapboxMap
      token="pk.eyJ1Ijoiam9uc2VuIiwiYSI6IkR6UU9oMDQifQ.dymRIgqv-UV6oz0-HCFx1w"
      styleUrl="mapbox://styles/jonsen/ckcgprwic1bxz1is2tvd560pg"
      width={width}
      height={height}
      zoom={zoom}
      center={center}
    >
      <Story />
    </MapboxMap>
  );
