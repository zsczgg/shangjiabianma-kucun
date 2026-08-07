const beijingDateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});

const beijingDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function formatBeijingTime(value: Date | string | null | undefined) {
  if (!value) return '—';
  return beijingDateTimeFormatter.format(new Date(value)).replaceAll('/', '-');
}

export function beijingDateKey(value: Date | string) {
  return beijingDateFormatter.format(new Date(value));
}

