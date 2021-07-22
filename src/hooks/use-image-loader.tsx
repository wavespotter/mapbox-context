import { useState, useEffect, useRef } from "react";
import deepEqual from "fast-deep-equal";

type ImageDefinition = { url: string; name: string };

export type ImageStatus = Record<
  string,
  {
    name: string;
    status: "loading" | "ready" | "errored" | "deleted";
    url: string;
  }
>;

/** Custom hook to manage loading an array of images for Mapbox layers
 *  that fetches the image data and adds it to the Mapbox map. Returns an object
 *  that contains the status of each loaded image.
 */
const useImageLoader = (
  map: mapboxgl.Map | null,
  imageDefs: ImageDefinition[] | undefined
) => {
  const recentImageDefs = useRef<ImageDefinition[] | undefined>();
  const [images, setImages] = useState<ImageStatus>({});

  // Load any new images whenever image definitions change
  useEffect(() => {
    if (!map || deepEqual(imageDefs, recentImageDefs.current)) return;
    // We really only want to run this logic when the image defs change
    // But React exhaustive deps wants us to have `images` in the dependency
    // array as well. That shouldn't be a problem but this will make sure we
    // don't get into an infinite loop situation.
    recentImageDefs.current = imageDefs;

    const deletedImageNames = Object.values(images)
      .filter((m) => m.status === "deleted")
      .map((m) => m.name);
    const existingImageNames = Object.keys(images);
    const incomingImageNames = imageDefs?.map((m) => m.name);
    const imagesToRemove = Object.values(images).filter(
      (m) => !incomingImageNames?.includes(m.name)
    );
    imagesToRemove.forEach((m) => {
      try {
        map.removeImage(m.name);
        setImages((old) => ({
          ...old,
          [m.name]: { name: m.name, url: m.url, status: "deleted" },
        }));
      } catch (e) { }
    });

    const imagestoAdd = imageDefs?.filter(
      (s) =>
        !existingImageNames.includes(s.name) ||
        deletedImageNames.includes(s.name)
    );

    imagestoAdd?.forEach((m) => {
      // Set pending state in the component state
      setImages((old) => ({
        ...old,
        [m.name]: { name: m.name, url: m.url, status: "loading" },
      }));
      try {
        map.loadImage(m.url, (err: any, image: HTMLImageElement) => {
          if (err) {
            // Update error in the component state
            setImages((old) => ({
              ...old,
              [m.name]: { url: m.url, name: m.name, status: "errored" },
            }));
            throw err;
          }
          try {
            if (!map.hasImage(m.name)) {
              map.addImage(m.name, image);
            }
          } catch (e) {
            console.warn(`Unable to add image (possibly already added) ${m.name}: `, e);
          }
          // Update success in component state
          setImages((old) => ({
            ...old,
            [m.name]: { name: m.name, url: m.url, status: "ready" },
          }));
        });
      } catch (e) {
        console.warn("Unable to load image: ", e);
      }
    });
  }, [map, images, imageDefs]);

  return images;
};

export default useImageLoader;
