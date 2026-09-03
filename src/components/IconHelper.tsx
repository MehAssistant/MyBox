import React from 'react';
import * as Icons from 'lucide-react';

interface IconHelperProps {
  name: string;
  className?: string;
  size?: number;
}

export const IconHelper: React.FC<IconHelperProps> = ({ name, className = '', size = 20 }) => {
  if (!name) {
    return <Icons.Wallet className={className} size={size} />;
  }

  // If name is an emoji character
  if (/\p{Extended_Pictographic}/u.test(name)) {
    return <span style={{ fontSize: `${size}px`, lineHeight: 1 }} className={className}>{name}</span>;
  }

  const IconComponent = (Icons as any)[name];
  if (!IconComponent) {
    return <Icons.Wallet className={className} size={size} />;
  }

  return <IconComponent className={className} size={size} />;
};

export default IconHelper;
