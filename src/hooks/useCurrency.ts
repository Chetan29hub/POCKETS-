import { useUserStore } from '@/store/useUserStore';

export function useCurrency() {
  const user = useUserStore(s => s.user);
  const symbol = user?.currency ?? '₹';

  const format = (amount: number, showSign = false): string => {
    const absVal = Math.abs(amount);
    const formatted = absVal.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    const sign = showSign ? (amount < 0 ? '-' : '+') : '';
    return `${sign}${symbol}${formatted}`;
  };

  return { symbol, format };
}
