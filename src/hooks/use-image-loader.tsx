import { deepEqual } from "fast-equals";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";

export interface ImageDefinition { url: string; name: string; sdf?: boolean }

type ImageStatus = Record<
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
  const [loadingComplete, setLoadingComplete] = useState(false);

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
      } catch (e) {
        console.warn("Error removing image:", e);
      }
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
        map.loadImage(
          m.url,
          (
            err: Error | null | undefined,
            image: HTMLImageElement | ImageBitmap | ImageData | null | undefined
          ) => {
            if (err || !image) {
              // Update error in the component state
              setImages((old) => ({
                ...old,
                [m.name]: { url: m.url, name: m.name, status: "errored" },
              }));
              if (err) throw err;
              return;
            }
            try {
              if (!map.hasImage(m.name)) {
                map.addImage(m.name, image, { sdf: Boolean(m.sdf) });
              }
            } catch (e) {
              console.warn(
                `Unable to add image (possibly already added) ${m.name}: `,
                e
              );
            }
            // Update success in component state
            setImages((old) => ({
              ...old,
              [m.name]: { name: m.name, url: m.url, status: "ready" },
            }));
          }
        );
      } catch (e) {
        console.warn("Unable to load image: ", e);
      }
    });
  }, [map, images, imageDefs]);

  useEffect(() => {
    const loaded = Object.keys(images)
      .map(
        // We treat anything that is not 'loading' as done. Even if there was an error,
        // we want to proceed from here.
        (i) => images[i].status !== "loading"
      )
      .every((value) => value === true);
    setLoadingComplete(loaded);
  }, [images]);

  return { images, loadingComplete };
};

export default useImageLoader;
