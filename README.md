# `mapbox-context`: A React wrapper for Mapbox GL JS built for the era of React context and hooks

## Setup

To include this library in your project, you must also link the Mapbox CSS in your document `<head>` section:

```html
<link
  href="https://api.mapbox.com/mapbox-gl-js/v1.11.1/mapbox-gl.css"
  rel="stylesheet"
/>
```

## Usage

Create a Mapbox map:

```jsx
<MapboxMap
  token={mapboxPublicAccessToken}
  styleUrl={mapboxStyleUrl}
  width="100%"
  height="100%"
/>
```

Render layers as children of the map:

```jsx
<MapboxMap
  token={mapboxPublicAccessToken}
  styleUrl={mapboxStyleUrl}
  width="100%"
  height="100%"
>
  <LineLayer id="line" color="rgba(255,0,0,1)" width={4} line={geojsonLine} />
  <DOMLayer position={{ longitude: -122, latitude: 38 }}>
    Any custom DOM Content
  </DOMLayer>
</MapboxMap>
```

Access the map and its properties from within a child component using context:

```typescript
import { MapboxMapContext } from "@sofarocean/mapbox-context";

const MyMapComponent: React.FC<{}> = () => {
  const { map, transform } = useContext(MapboxMapContext);

  return <div>Zoom level is: {transform.zoom}</div>;
};
```

Declaratively register map even handlers:

```typescript
import { useMapEvent } from "@sofarocean/mapbox-context";

// Must be mounted within a `MapboxMap` context
const MyMapComponent: React.FC<{}> = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const handleClick = useCallback((ev) => {
    setPosition(ev.lngLat);
  }, []);

  // Whenver the map is clicked, update this component's state
  useMapEvent("click", handleClick);

  return <div>Last clicked position was: ({position?.join(", ")})</div>;
};
```
