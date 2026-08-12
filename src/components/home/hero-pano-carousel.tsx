import Image from "next/image";
import "./hero-pano-carousel.css";

const SLIDE_MS = 12000;

const SLIDES = [
  "/panoimg1.jpg",
  "/panoimg2.jpg",
  "/panoimg3.jpg",
  "/panoimg4.jpg",
  "/panoimg5.jpg",
  "/panoimg6.jpg",
  "/panoimg7.jpg",
] as const;

export function HeroPanoCarousel() {
  return (
    <div className="hero-pano" aria-hidden="true">
      {SLIDES.map((src, index) => {
        const direction = index % 2 === 0 ? "left" : "right";
        return (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            sizes="100vw"
            priority={index === 0}
            className={[
              "hero-pano__slide",
              `hero-pano__slide--${direction}`,
              index === 0 ? "hero-pano__slide--static" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ animationDelay: `${index * (SLIDE_MS / 1000)}s` }}
          />
        );
      })}
      <div className="hero-pano__veil" />
    </div>
  );
}
