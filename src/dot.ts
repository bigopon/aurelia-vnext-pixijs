import { customElement, bindable } from '@aurelia/runtime';
import view from './dot.html';

@customElement({
  name: 'sierpinski-triangle-dot',
  templateOrNode: view,
  build: {
    required: true,
    compiler: 'default'
  },
  surrogates: [],
  instructions: []
})
export class SierpinskiTriangleDot {

  @bindable()
  x: number;

  @bindable()
  y: number;

  @bindable()
  size: number;

  @bindable()
  text: string;
}
