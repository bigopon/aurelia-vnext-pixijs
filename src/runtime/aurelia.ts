import { DI, IContainer, IRegistry, PLATFORM } from '@aurelia/kernel';
import { BindingFlags } from './binding/binding-flags';
import { Lifecycle, LifecycleFlags } from './templating';
import { ICustomElement } from './templating/custom-element';
import { IRenderingEngine } from './templating/rendering-engine';

export interface ISinglePageApp {
  host: any;
  component: any;
}

export class Aurelia {
  private components: ICustomElement[] = [];
  private startTasks: (() => void)[] = [];
  private stopTasks: (() => void)[] = [];
  private isStarted: boolean = false;

  constructor(private container: IContainer = DI.createContainer()) {}

  public register(...params: (IRegistry | Record<string, Partial<IRegistry>>)[]): this {
    this.container.register(...params);
    return this;
  }

  public app(config: ISinglePageApp): this {
    const component: ICustomElement = config.component;

    const startTask = () => {
      if (!this.components.includes(component)) {
        this.components.push(component);
        component.$hydrate(
          this.container.get(IRenderingEngine),
          config.host
        );
      }

      component.$bind(BindingFlags.fromStartTask | BindingFlags.fromBind);

      Lifecycle.beginAttach(config.host, LifecycleFlags.none)
        .attach(component)
        .end();
    };

    this.startTasks.push(startTask);

    this.stopTasks.push(() => {
      const task = Lifecycle.beginDetach(LifecycleFlags.noTasks)
        .detach(component)
        .end();

      const flags = BindingFlags.fromStopTask | BindingFlags.fromUnbind;

      if (task.done) {
        component.$unbind(flags);
      } else {
        task.wait().then(() => component.$unbind(flags));
      }
    });

    if (this.isStarted) {
      startTask();
    }

    return this;
  }

  public start(): this {
    this.startTasks.forEach(x => x());
    this.isStarted = true;
    return this;
  }

  public stop(): this {
    this.isStarted = false;
    this.stopTasks.forEach(x => x());
    return this;
  }
}

(<any>PLATFORM.global).Aurelia = Aurelia;

export interface IPixiApp {
  component: ICustomElement | { new(...args: any): ICustomElement };
  host: Element;
}

export class AureliaPixi {
  private components: ICustomElement[] = [];
  private startTasks: (() => void)[] = [];
  private stopTasks: (() => void)[] = [];
  private isStarted: boolean = false;
  

  constructor(private container: IContainer = DI.createContainer()) {}

  public register(...params: (IRegistry | Record<string, Partial<IRegistry>>)[]): this {
    this.container.register(...params);
    return this;
  }

  public app(config: IPixiApp): this {
    const app = this.createApplication();
    const component: ICustomElement = typeof config.component === 'function'
      ? this.container.get(config.component)
      : config.component;

    const startTask = () => {
      config.host.appendChild(app.view);
      if (!this.components.includes(component)) {
        this.components.push(component);
        component.$hydrate(
          this.container.get(IRenderingEngine),
          app.stage
        );
      }

      component.$bind(BindingFlags.fromStartTask | BindingFlags.fromBind);

      Lifecycle.beginAttach(app.stage, LifecycleFlags.none)
        .attach(component)
        .end();
    };

    this.startTasks.push(startTask);

    this.stopTasks.push(() => {
      const task = Lifecycle.beginDetach(LifecycleFlags.noTasks)
        .detach(component)
        .end();

      const flags = BindingFlags.fromStopTask | BindingFlags.fromUnbind;

      if (task.done) {
        component.$unbind(flags);
      } else {
        task.wait().then(() => component.$unbind(flags));
      }
    });

    if (this.isStarted) {
      startTask();
    }

    return this;
  }

  public start(): this {
    this.startTasks.forEach(x => x());
    this.isStarted = true;
    return this;
  }

  public stop(): this {
    this.isStarted = false;
    this.stopTasks.forEach(x => x());
    return this;
  }

  private createApplication(options: PIXI.ApplicationOptions = {}) {
    return new PIXI.Application({
      width: 512,
      height: 512,
      antialias: true,
      transparent: false,
      resolution: 1,
      ...options
    });
  }
}
