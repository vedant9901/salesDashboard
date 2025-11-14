import Image from "next/image";

export function Logo() {
  const logoUrl = "https://wp.magson.in/wp-content/uploads/2024/03/logo.png";

  return (
    <div className="relative w-full max-w-xs h-16 sm:h-20 md:h-24 lg:h-28">
      {/* Light mode */}
      <Image
        src={logoUrl}
        alt="Magson logo"
        fill
        className="object-contain"
        quality={100}
        priority
      />

      {/* Dark mode */}
      <Image
        src={logoUrl} // use a different URL if you have a dark version
        alt="Magson logo"
        fill
        className="hidden object-contain dark:block"
        role="presentation"
        quality={100}
        priority
      />
    </div>
  );
}
