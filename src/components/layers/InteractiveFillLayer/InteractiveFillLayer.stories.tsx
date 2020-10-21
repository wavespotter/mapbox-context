import React, { useState, useCallback, useContext, useMemo } from "react";

import { Story, Meta } from "@storybook/react/types-6-0";

import InteractiveFillLayer, {
    InteractiveFillLayerProps,
    InteractiveFillData,
} from ".";
import MapDecorator from "../../../storybook-helpers/map-decorator";

import { InteractiveLineLayer, MapboxMapContext } from "../../..";
import FillLayer, { PolygonRingCoordinates } from "../FillLayer";

export default {
    title: "Interactive Fill Layer",
    component: InteractiveFillLayer,
    argTypes: {},
    args: {},
    decorators: [MapDecorator()],
} as Meta;

const mockFills = [
    {
        id: "A",
        coordinates: [[
            [0, 0],
            [1, 0],
            [21, 20],
            [1, 40],
            [0, 40],
            [20, 20],
            [0, 0],
        ] as PolygonRingCoordinates],
        properties: {
            color: "#DD00DD",
        },
    },
    {
        id: "B",
        coordinates: [[
            [20, 10],
            [100, 10],
            [100, 20],
            [20, 20],
            [20, 10],
        ] as PolygonRingCoordinates],
        properties: {
            color: "#55FF55",
        },
    },
    {
        id: "C",
        coordinates: [[
            [40, 0],
            [60, 0],
            [80, 20],
            [60, 40],
            [40, 40],
            [50, 20],
            [40, 0],
        ] as PolygonRingCoordinates],
        properties: {
            color: "#00DDDD",
        },
    },
];
const fillStyle: {
    layout: mapboxgl.FillLayout;
    paint: mapboxgl.FillPaint;
} = {
    layout: {},
    paint: {
        "fill-opacity": ["case", ["get", "selected"], 1, 0.5],
        "fill-color": ["get", "color"],
    },
};
// Big transparent lines to increase the touch area of fills
const bigTransparentLineStyle: {
    layout: mapboxgl.LineLayout;
    paint: mapboxgl.LinePaint;
} = {
    layout: {},
    paint: {
        "line-color": "rgba(0,0,0,0)",
        "line-width": 40,
    },
};

const InteractiveFillsStateManager: Story<InteractiveFillLayerProps & {
    polygons: InteractiveFillData[];
    withBigTouchZones: boolean;
}> = (props) => {
    const {map} = useContext(MapboxMapContext);
    const [polygons, setPolygons] = useState(
        props.polygons.map((p) => ({
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
    const lines = useMemo(() =>
        polygons.map(p => ({...p, coordinates: p.coordinates[0]})).map((p) => ({
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
        })), [polygons]
    );

    const handleDragStart = useCallback(() => {
    }, []);
    const handleDragEnd = useCallback(() => {
    }, []);
    const handleDrag = useCallback(
        (
            id: string | number,
            newLocation: { latitude: number; longitude: number }
        ) => {
            if (!map) return;

            // Move the point to the current pointer position
            setPolygons((_fills) =>
                _fills.map((p) => (p.id !== id ? p : {...p, ...newLocation}))
            );
        },
        [map]
    );

    const handleClick = useCallback((id: string | number) => {
        setPolygons((old) =>
            old.map((o) =>
                o.id === id
                    ? {
                        ...o,
                        properties: {...o.properties, selected: !o.properties.selected},
                    }
                    : o
            )
        );
    }, []);

    const handleHoverEnter = useCallback((id: string | number) => {
        setPolygons((old) =>
            old.map((o) =>
                o.id === id
                    ? {
                        ...o,
                        properties: {...o.properties, hovering: true},
                    }
                    : o
            )
        );
    }, []);

    const handleHoverLeave = useCallback((id: string | number) => {
        setPolygons((old) =>
            old.map((o) =>
                o.id === id
                    ? {
                        ...o,
                        properties: {...o.properties, hovering: false},
                    }
                    : o
            )
        );
    }, []);

    return props.withBigTouchZones ? (
        <>
            <InteractiveFillLayer
                polygons={polygons}
                style={fillStyle}
                onClick={handleClick}
                onHoverEnter={handleHoverEnter}
                onHoverLeave={handleHoverLeave}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
            />
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
        <InteractiveFillLayer
            polygons={polygons}
            style={fillStyle}
            onClick={handleClick}
            onHoverEnter={handleHoverEnter}
            onHoverLeave={handleHoverLeave}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
        />
    );
};

export const AFewFills = InteractiveFillsStateManager.bind({});
AFewFills.args = {
    polygons: mockFills,
};

export const WithLargeInteractionZone = InteractiveFillsStateManager.bind({});
WithLargeInteractionZone.args = {
    polygons: mockFills,
    withBigTouchZones: true,
};
