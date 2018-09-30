/// <reference path="../node_modules/@types/pixi.js/index.d.ts" />
import { BasicConfiguration } from '@aurelia/jit';
import { Aurelia } from '@aurelia/runtime';
import { App } from './app';
import { SierpinskiTriangle } from './sierpinski-triangle';
import { SierpinskiTriangleDot } from './dot';
import './pixi-app';


window['App'] = App;
window['SierpinskiTriangle'] = SierpinskiTriangle;
window['SierpinskiTriangleDot'] = SierpinskiTriangleDot;
window['PIXI'] = PIXI;

const au = window['au'] = new Aurelia()
  .register(
    BasicConfiguration,
    // SierpinskiTriangle as any,
    // SierpinskiTriangleDot as any
  );
au
  .app({ host: document.querySelector('app'), component: new App() });
au
  .start();
