import { useStoreSettings } from '@/contexts/StoreSettingsContext';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: {
    brand: 'text-xl',
    subline: 'text-[8px] tracking-[0.25em]',
  },
  md: {
    brand: 'text-2xl',
    subline: 'text-[10px] tracking-[0.3em]',
  },
  lg: {
    brand: 'text-4xl',
    subline: 'text-xs tracking-[0.35em]',
  },
  xl: {
    brand: 'text-5xl md:text-6xl',
    subline: 'text-sm tracking-[0.4em]',
  },
};

export const BrandLogo = ({ size = 'md', className = '' }: BrandLogoProps) => {
  const sizes = sizeClasses[size];
  const { settings } = useStoreSettings();
  const storeName = settings?.store_name || 'Fascino';

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <h1 className={`brand-name ${sizes.brand}`}>{storeName}</h1>
      <p className={`brand-subline mt-1 ${sizes.subline}`}>
        By <span className="brand-highlight">P</span>ayal
      </p>
    </div>
  );
};

export default BrandLogo;
