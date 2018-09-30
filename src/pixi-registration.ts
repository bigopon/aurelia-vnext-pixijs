import { DOM } from './runtime';

const map = DOM.pixi.map;
map('container', () => new PIXI.Container() as any);
map('b', () => {
  const text = new PIXI.Text();
  text.style.fontWeight = 'bold';
  return text as any;
});
map('au-marker', () => new PIXI.Text() as any);
map('text', () => new PIXI.Text() as any);
map('button', () => {
  return new PIXI.Sprite() as any;
});
map('circle', () => {
  return new PIXI.Circle() as any;
});