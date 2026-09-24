import {
  Calendar,
  CalendarPlus,
  ClipboardList,
  Truck,
  User,
  Clock,
  PlusCircle,
  BarChart,
  Users,
  Circle,
  type LucideIcon,
} from 'lucide-react';

/**
 * `modules.icon` es un string libre en la base (RF-301: catálogo
 * administrable). Este mapa lo resuelve a un componente real de una
 * librería de íconos de verdad — nunca emoji ni un glifo Unicode. Un
 * nombre desconocido cae en un ícono neutro, no rompe la pantalla.
 */
const ICONS: Record<string, LucideIcon> = {
  calendar: Calendar,
  'calendar-plus': CalendarPlus,
  'clipboard-list': ClipboardList,
  truck: Truck,
  user: User,
  clock: Clock,
  'plus-circle': PlusCircle,
  'bar-chart': BarChart,
  users: Users,
};

export function resolveModuleIcon(name: string | null): LucideIcon {
  if (!name) return Circle;
  return ICONS[name] ?? Circle;
}
