import { propertyObserver } from './property-observer';
import { BindingFlags } from './binding-flags';
import { IPropertyObserver } from './observation';
import { IIndexable } from '@aurelia/kernel';

// tslint:disable-next-line:interface-name
export interface PixiPositionObserver extends IPropertyObserver<IIndexable, string> {}

@propertyObserver()
export class PixiPositionObserver implements PixiPositionObserver {
  readonly obj: PIXI.DisplayObject;
  readonly propertyName: 'x' | 'y';
  public currentValue: number;
  private setValueCore: (value: number) => void;

  constructor(
    obj: PIXI.DisplayObject,
    propertyName: 'x' | 'y'
  ) {
    this.obj = obj;
    this.propertyName = propertyName;
    this.getValue = propertyName === 'x' ? this.getX : this.getY;
    this.setValueCore = propertyName === 'x' ? this.setX : this.setY;
  }

  public getValue(): number {
    return this.obj.position[this.propertyName];
  }

  public setValue(newValue: number, flags: BindingFlags): void {
    if (typeof newValue !== 'number') {
      throw new Error('Invalid position value');
    }
    const currentValue = this.currentValue;
    if (currentValue !== newValue) {
      this.setValueCore(newValue);
      this.currentValue = newValue;
      if (!(flags & BindingFlags.fromBind)) {
        this.callSubscribers(newValue, currentValue, flags);
      }
    }
  }

  private getX(): number {
    return this.obj.position.x;
  }

  private getY(): number {
    return this.obj.position.y;
  }

  private setX(value: number): void {
    this.obj.position.x = value;
  }

  private setY(value: number): void {
    this.obj.position.y = value;
  }
}
