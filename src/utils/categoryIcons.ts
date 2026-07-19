import {
  UtensilsCrossed, Plane, Fuel, Home, GraduationCap,
  ShoppingBag, HeartPulse, Smartphone, Receipt,
  Clapperboard, TrendingUp, Cookie, MoreHorizontal,
  Banknote, Briefcase, Gift, Building2, CirclePlus,
  LucideIcon,
} from 'lucide-react-native';

const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Plane,
  Fuel,
  Home,
  GraduationCap,
  ShoppingBag,
  HeartPulse,
  Smartphone,
  Receipt,
  Clapperboard,
  TrendingUp,
  Cookie,
  MoreHorizontal,
  Banknote,
  Briefcase,
  Gift,
  Building2,
  CirclePlus,
};

export function getCategoryIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? MoreHorizontal;
}
