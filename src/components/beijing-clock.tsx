'use client';

import { useEffect, useState } from 'react';
import { IconClock } from '@tabler/icons-react';
import { formatBeijingTime } from '@/lib/date-time';

export function BeijingClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => setTime(formatBeijingTime(new Date()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="beijing-clock" title="系统统一使用北京时间"><IconClock/><div><small>北京时间</small><time suppressHydrationWarning>{time || '正在同步…'}</time></div></div>;
}

