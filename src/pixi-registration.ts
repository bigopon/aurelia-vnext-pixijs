import { DOM } from './runtime';

const map = DOM.pixi.map;
map('container', () => new PIXI.Container());
map('b', () => {
  const text = new PIXI.Text();
  text.style.fontWeight = 'bold';
  return text;
});
map('au-marker', () => new PIXI.Text());
map('text', () => new PIXI.Text());
map('button', () => {
  return new PIXI.Sprite();
});