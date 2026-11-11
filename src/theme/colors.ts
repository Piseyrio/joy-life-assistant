export const colors = {
  background: '#111923',
  surface: '#192535',
  cards: '#1B293A',
  blue: '#3B9EFF',
  cyan: '#55C7E8',
  text: '#F4F7FB',
  secondary: '#91A5BC',
  danger: '#FF6B7A',
  success: '#4CD964',
  warning: '#FFB020',
  border: '#2A3B50',
  overlay: 'rgba(0,0,0,0.55)',
} as const;

export type ColorKey = keyof typeof colors;
