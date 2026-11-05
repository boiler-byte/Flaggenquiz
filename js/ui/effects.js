export function celebrate(container) {
  if (!container || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  layer.setAttribute('aria-hidden', 'true');
  const colors = ['#57f6d0', '#66adff', '#b7a2ff', '#f8d47d'];
  for (let i = 0; i < 22; i++) {
    const piece = document.createElement('i');
    piece.style.setProperty('--x', `${Math.random() * 100}%`);
    piece.style.setProperty('--dx', `${Math.round((Math.random() - 0.5) * 170)}px`);
    piece.style.setProperty('--delay', `${Math.random() * 0.16}s`);
    piece.style.setProperty('--angle', `${Math.round(Math.random() * 520)}deg`);
    piece.style.background = colors[i % colors.length];
    layer.append(piece);
  }
  container.append(layer);
  window.setTimeout(() => layer.remove(), 1550);
}
