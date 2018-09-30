import { bindable, customElement } from '@aurelia/runtime';
import { SierpinskiTriangleDot } from './dot';
import view from './sierpinski-triangle.html';

@customElement({
  name: 'sierpinski-triangle',
  templateOrNode: view,
  build: {
    required: true,
    compiler: 'default'
  },
  dependencies: [
    // SierpinskiTriangleDot
  ],
  instructions: []
})
export class SierpinskiTriangle {

  @bindable()
  x: number;

  @bindable()
  y: number;

  @bindable()
  size: number;

  @bindable()
  text: string;
}
