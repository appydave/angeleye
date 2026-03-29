export type NavItemTier = 'primary' | 'secondary';

export interface NavItem {
  key: string;
  label: string;
  icon?: string;
  tier?: NavItemTier;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export type NavConfig = NavGroup[];

export const navConfig: NavConfig = [
  {
    label: 'Main',
    items: [
      { key: 'observer', label: 'Observer', tier: 'primary' },
      { key: 'organiser', label: 'Organiser', tier: 'primary' },
      { key: 'workflows', label: 'Workflows', tier: 'primary' },
      { key: 'dashboard', label: 'Dashboard', tier: 'primary' },
      { key: 'infographic', label: 'Infographic', tier: 'primary' },
    ],
  },
  {
    label: 'System',
    items: [
      { key: 'inspector', label: 'Inspector', tier: 'secondary' },
      { key: 'settings', label: 'Settings', tier: 'secondary' },
      { key: 'mockups', label: 'Mockups', tier: 'secondary' },
    ],
  },
];
