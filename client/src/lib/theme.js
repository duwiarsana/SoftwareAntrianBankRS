export const THEMES = [
  { id: 'indigo', name: 'Indigo (Default)', color: '#6366f1' },
  { id: 'emerald', name: 'Emerald', color: '#10b981' },
  { id: 'rose', name: 'Rose', color: '#f43f5e' },
  { id: 'amber', name: 'Amber', color: '#f59e0b' },
  { id: 'cyan', name: 'Cyan', color: '#06b6d4' }
];

export function applyTheme(themeId) {
  // Reset previous theme classes
  document.body.classList.remove(
    'theme-emerald',
    'theme-rose',
    'theme-amber',
    'theme-cyan'
  );

  // Apply new theme class if it's not the default (indigo)
  if (themeId && themeId !== 'indigo') {
    document.body.classList.add(`theme-${themeId}`);
  }
}
