import { bindable, customElement } from '@aurelia/runtime';
import view from './app.html';

@customElement({
  name: 'app',
  templateOrNode: view,
  build: {
    required: true,
    compiler: 'default'
  },
  instructions: []
})
export class App {
  message = 'Hello World!';

  seconds = 0;
  start = new Date().getTime();

  transform = '';

  @bindable()
  haveFun: boolean;

  intervalID: any;

  attached() {
    this.tick0();
    this.intervalID = setInterval(this.tick0, 1000);
    requestAnimationFrame(this.tick);
  }

  haveFunChanged(shouldHaveFun: boolean) {
    if (shouldHaveFun) {
      clearInterval(this.intervalID);
    } else {
      this.intervalID = setInterval(this.tick0, 1000);
    }
  }

  tick0 = () => {
    this.seconds = (this.seconds % 10) + 1;
    // this.intervalID = setInterval(this.tick0, 1000);
  }

  tick = () => {
    let elapsed = new Date().getTime() - this.start;
    let t = (elapsed / 1000) % 10;
    let scale = 1 + (t > 5 ? 10 - t : t) / 10;
    this.transform = 'scaleX(' + (scale / 2.1) + ') scaleY(0.7) translateZ(0.1px)';
    if (this.haveFun) {
      this.seconds = (this.seconds % 10) + 1;
    }
    requestAnimationFrame(this.tick);
  }
}