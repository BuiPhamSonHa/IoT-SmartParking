import { ReactNode, useEffect, useMemo, useState } from "react";

const LOCAL_CAMERAS = [
  "/cameras/cam1.jpg",
  "/cameras/cam2.jpg",
  "/cameras/cam3.jpg",
  "/cameras/cam4.jpg",
  "/cameras/cam5.jpg",
  "/cameras/cam6.jpg",
];

function fallbackUrl(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

export function CameraFeed(props: {
  /** If provided, try to show this URL first (ESP32 snapshot or backend URL). */
  srcOverride?: string;

  seed: string;
  className?: string;
  overlayLeft?: ReactNode;
  overlayRight?: ReactNode;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [useLocalFallback, setUseLocalFallback] = useState(false);

  const localSrc = useMemo(() => {
    const idx = Math.floor(Math.random() * LOCAL_CAMERAS.length);
    return LOCAL_CAMERAS[idx];
  }, [props.seed]);

  const preferred = props.srcOverride && !useLocalFallback ? props.srcOverride : localSrc;
  const finalSrc = error ? fallbackUrl(`smartpark-${props.seed}`, 1200, 700) : preferred;

  useEffect(() => {
    setLoaded(false);
    setError(false);
    setUseLocalFallback(false);
  }, [props.srcOverride, localSrc]);

  return (
    <div
      className={
        "relative w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 " +
        (props.className || "")
      }
    >
      {/* Skeleton */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
      )}

      <img
        src={finalSrc}
        alt="camera"
        className={"w-full h-full object-cover " + (loaded ? "opacity-100" : "opacity-0")}
        onLoad={() => setLoaded(true)}
        onError={() => {
          // If override url fails, fall back to local cameras first. If that also fails -> picsum.
          if (props.srcOverride && !useLocalFallback) setUseLocalFallback(true);
          else setError(true);
        }}
        loading="lazy"
      />

      {/* overlays */}
      <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded-lg bg-black/40 text-white backdrop-blur">
        {props.overlayLeft}
      </div>
      <div className="absolute top-2 right-2 text-xs px-2 py-1 rounded-lg bg-black/40 text-white backdrop-blur">
        {props.overlayRight}
      </div>
    </div>
  );
}
