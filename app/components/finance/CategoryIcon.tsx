import { Utensils, Home, Car, Gamepad2, Heart, ShieldCheck, TrendingUp, ShoppingBag, GraduationCap, Plane, PawPrint, Briefcase, Gift, Coffee, Wallet, CircleDollarSign, type LucideIcon } from 'lucide-react';
export const CATEGORY_ICONS: Record<string, LucideIcon> = { Utensils, Home, Car, Gamepad2, Heart, ShieldCheck, TrendingUp, ShoppingBag, GraduationCap, Plane, PawPrint, Briefcase, Gift, Coffee, Wallet, CircleDollarSign };
export function CategoryIcon({ name, color, size = 20 }: { name: string; color: string; size?: number }) {
  const Icon = CATEGORY_ICONS[name] ?? Wallet;
  return <span className="category-icon" style={{ backgroundColor: `${color}16`, color: color === '#9FE870' ? '#386B16' : color }}><Icon size={size} strokeWidth={1.8} aria-hidden="true" /></span>;
}
