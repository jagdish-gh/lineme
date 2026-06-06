type LogoProps = {
  animated?: boolean;
};

export function Logo({ animated = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`text-3xl font-extrabold tracking-tight ${
          animated ? "brand-gradient-wave" : ""
        }`}
      >
        <span className="font-light">Line</span>
        <span className="font-black">ME</span>
      </div>
    </div>
  );
}
