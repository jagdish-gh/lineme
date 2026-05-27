// import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="text-3xl font-extrabold tracking-tight">
        <span className="font-light">Line</span>
        <span className="font-black">ME</span>
      </div>
    </div>
     // <Image
    //   src="/lineme-logo.png"
    //   alt=""
    //   width={620}
    //   height={220}
    //   priority
    //   className="h-12 w-auto rounded-md object-contain shadow-glow transition duration-300 group-hover:scale-105"
    // />
  );
}
