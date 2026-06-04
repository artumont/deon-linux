interface BackgroundLayerProps {
  /** URL of the background image to display */
  backgroundImage?: string;
}

function BackgroundLayer({ backgroundImage = "/launcher_bg.jpeg" }: BackgroundLayerProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div
        className="absolute inset-0 bg-[length:100%_100%] bg-no-repeat scale-105"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
      />

      <div className="absolute inset-0 bg-black/65 backdrop-blur-[2.5px]" />
      <div className="absolute inset-0 vignette-overlay" />
      <div className="absolute inset-0 hud-scanlines" />
    </div>
  );
}

export default BackgroundLayer;
