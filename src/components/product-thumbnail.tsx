'use client';

import { useState } from 'react';
import { IconPhoto } from '@tabler/icons-react';

export function ProductThumbnail({ src, name, size = 'small' }: { src?: string | null; name: string; size?: 'small' | 'large' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className={`product-thumbnail placeholder ${size}`} aria-label={`${name} 暂无图片`}><IconPhoto/></span>;
  return <span className={`product-thumbnail ${size}`}><img src={src} alt={`${name} 商品图片`} onError={() => setFailed(true)}/></span>;
}
