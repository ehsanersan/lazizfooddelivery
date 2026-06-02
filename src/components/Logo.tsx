// لوگوی برند لذیذ پخت خلیج فارس

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  light?: boolean;
}

export default function Logo({ size = 'md', light = false }: LogoProps) {
  const sizes = {
    sm: { text: 'text-xl', icon: 'w-9 h-9' },
    md: { text: 'text-2xl', icon: 'w-12 h-12' },
    lg: { text: 'text-4xl', icon: 'w-16 h-16' },
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${sizes[size].icon}`}>
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#5B21B6" />
            </linearGradient>
            <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="30" fill="url(#logoGradient)" />
          <path 
            d="M32 12L35.5 24.5H48L37.5 32L41 44.5L32 37L23 44.5L26.5 32L16 24.5H28.5L32 12Z" 
            fill="url(#yellowGradient)"
          />
          <ellipse cx="32" cy="44" rx="14" ry="6" fill="white" fillOpacity="0.9" />
          <ellipse cx="32" cy="42" rx="10" ry="4" fill="#FFFBEB" />
        </svg>
      </div>
      <div>
        <h1 className={`${sizes[size].text} font-black leading-tight ${
          light 
            ? 'text-white' 
            : 'bg-gradient-to-l from-laziz-purple to-laziz-purple-dark bg-clip-text text-transparent'
        }`}>
          لذیذ
        </h1>
        {size !== 'sm' && (
          <p className={`text-[10px] font-medium -mt-0.5 ${light ? 'text-laziz-yellow' : 'text-laziz-gray'}`}>
            مجموعه غذایی
          </p>
        )}
      </div>
    </div>
  );
}
