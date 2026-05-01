import { Pill } from './Pill';

export function RoleBadge({ role }: { role: 'admin' | 'super_admin' }) {
  if (role === 'super_admin') return <Pill color="teal">Super Admin</Pill>;
  return <Pill color="slate">관리자</Pill>;
}
