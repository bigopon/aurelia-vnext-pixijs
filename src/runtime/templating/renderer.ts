// tslint:disable:max-line-length
import { Immutable, Reporter } from '@aurelia/kernel';
import { Binding } from '../binding/binding';
import { BindingMode } from '../binding/binding-mode';
import { Call } from '../binding/call';
import { IEventManager } from '../binding/event-manager';
import { BindingType, IExpressionParser } from '../binding/expression-parser';
import { LetBinding } from '../binding/let-binding';
import { Listener } from '../binding/listener';
import { IObserverLocator } from '../binding/observer-locator';
import { Ref } from '../binding/ref';
import { DOM, INode } from '../dom';
import { CustomAttributeResource, ICustomAttribute } from './custom-attribute';
import { CustomElementResource, ICustomElement } from './custom-element';
import {
  ICallBindingInstruction,
  IHydrateAttributeInstruction,
  IHydrateElementInstruction,
  IHydrateTemplateController,
  ILetElementInstruction,
  IListenerBindingInstruction,
  IPropertyBindingInstruction,
  IRefBindingInstruction,
  IRenderStrategyInstruction,
  ISetAttributeInstruction,
  ISetPropertyInstruction,
  IStylePropertyBindingInstruction,
  ITextBindingInstruction,
  TargetedInstructionType,
  TemplateDefinition,
  TemplatePartDefinitions
} from './instructions';
import { IRenderContext } from './render-context';
import { IRenderStrategy, RenderStrategyResource } from './render-strategy';
import { IRenderable } from './renderable';
import { IRenderingEngine } from './rendering-engine';

export interface IRenderer {
  render(renderable: IRenderable, targets: ArrayLike<INode>, templateDefinition: TemplateDefinition, host?: PIXI.Container, parts?: TemplatePartDefinitions): void;
  hydrateElementInstance(renderable: IRenderable, target: PIXI.Container, instruction: Immutable<IHydrateElementInstruction>, component: ICustomElement): void;
}

// tslint:disable:function-name
// tslint:disable:no-any

/* @internal */
export class Renderer implements IRenderer {
  constructor(
    private context: IRenderContext,
    private observerLocator: IObserverLocator,
    private eventManager: IEventManager,
    private parser: IExpressionParser,
    private renderingEngine: IRenderingEngine
  ) { }

  public render(
    renderable: IRenderable,
    targets: ArrayLike<INode>,
    definition: TemplateDefinition,
    host?: PIXI.Container,
    parts?: TemplatePartDefinitions
  ): void {
    const targetInstructions = definition.instructions;
    // const pixiTargets: PIXI.DisplayObject[] = nodesToPixiElements(targets, host);
    const pixiTargets: PIXI.DisplayObject[] = Array.from(targets, node => node['$pixi']);
    
    if (pixiTargets.length !== targetInstructions.length) {
      if (pixiTargets.length > targetInstructions.length) {
        throw Reporter.error(30);
      } else {
        throw Reporter.error(31);
      }
    }
    for (let i = 0, ii = pixiTargets.length; i < ii; ++i) {
      const instructions = targetInstructions[i];
      const target = pixiTargets[i];

      for (let j = 0, jj = instructions.length; j < jj; ++j) {
        const current = instructions[j];
        (this as any)[current.type](renderable, target, current, parts);
      }
    }

    if (host) {
      const surrogateInstructions = definition.surrogates;

      for (let i = 0, ii = surrogateInstructions.length; i < ii; ++i) {
        const current = surrogateInstructions[i];
        (this as any)[current.type](renderable, host, current, parts);
      }
    }
  }

  public hydrateElementInstance(renderable: IRenderable, target: PIXI.Container, instruction: Immutable<IHydrateElementInstruction>, component: ICustomElement): void {
    const childInstructions = instruction.instructions;

    component.$hydrate(this.renderingEngine, target, instruction);

    for (let i = 0, ii = childInstructions.length; i < ii; ++i) {
      const current = childInstructions[i];
      const currentType = current.type;

      (this as any)[currentType](renderable, component, current);
    }

    renderable.$bindables.push(component);
    renderable.$attachables.push(component);
  }

  public [TargetedInstructionType.textBinding](renderable: IRenderable, target: PIXI.Text, instruction: Immutable<ITextBindingInstruction>): void {
    const srcOrExpr = instruction.srcOrExpr as any;
    renderable.$bindables.push(new Binding(
      srcOrExpr.$kind
        ? srcOrExpr
        : this.parser.parse(srcOrExpr, BindingType.Interpolation),
      target,
      'text',
      BindingMode.toView,
      this.observerLocator,
      this.context
    ));
  }

  public [TargetedInstructionType.propertyBinding](renderable: IRenderable, target: any, instruction: Immutable<IPropertyBindingInstruction>): void {
    const srcOrExpr = instruction.srcOrExpr as any;
    renderable.$bindables.push(new Binding(
      srcOrExpr.$kind
        ? srcOrExpr
        : this.parser.parse(srcOrExpr, BindingType.IsPropertyCommand | instruction.mode),
      target,
      instruction.dest,
      instruction.mode,
      this.observerLocator,
      this.context
    ));
  }

  public [TargetedInstructionType.listenerBinding](renderable: IRenderable, target: PIXI.DisplayObject, instruction: Immutable<IListenerBindingInstruction>): void {
    const srcOrExpr = instruction.srcOrExpr as any;
    renderable.$bindables.push(new Listener(
      instruction.dest,
      instruction.strategy,
      srcOrExpr.$kind
        ? srcOrExpr
        : this.parser.parse(srcOrExpr, BindingType.IsEventCommand | (instruction.strategy + BindingType.DelegationStrategyDelta)),
      target,
      instruction.preventDefault,
      this.eventManager,
      this.context
    ));
  }

  public [TargetedInstructionType.callBinding](renderable: IRenderable, target: any, instruction: Immutable<ICallBindingInstruction>): void {
    const srcOrExpr = instruction.srcOrExpr as any;
    renderable.$bindables.push(new Call(
      srcOrExpr.$kind
        ? srcOrExpr
        : this.parser.parse(srcOrExpr, BindingType.CallCommand),
      target,
      instruction.dest,
      this.observerLocator,
      this.context
    ));
  }

  public [TargetedInstructionType.refBinding](renderable: IRenderable, target: any, instruction: Immutable<IRefBindingInstruction>): void {
    const srcOrExpr = instruction.srcOrExpr as any;
    renderable.$bindables.push(new Ref(
      srcOrExpr.$kind
        ? srcOrExpr
        : this.parser.parse(srcOrExpr, BindingType.IsRef),
      target,
      this.context
    ));
  }

  public [TargetedInstructionType.stylePropertyBinding](renderable: IRenderable, target: any, instruction: Immutable<IStylePropertyBindingInstruction>): void {
    const srcOrExpr = instruction.srcOrExpr as any;
    renderable.$bindables.push(new Binding(
      srcOrExpr.$kind
        ? srcOrExpr
        : this.parser.parse(srcOrExpr, BindingType.IsPropertyCommand | BindingMode.toView),
      (<any>target).style,
      instruction.dest,
      BindingMode.toView,
      this.observerLocator,
      this.context
    ));
  }

  public [TargetedInstructionType.setProperty](renderable: IRenderable, target: any, instruction: Immutable<ISetPropertyInstruction>): void {
    target[instruction.dest] = instruction.value;
  }

  public [TargetedInstructionType.setAttribute](renderable: IRenderable, target: any, instruction: Immutable<ISetAttributeInstruction>): void {
    // DOM.setAttribute(target, instruction.dest, instruction.value);
  }

  public [TargetedInstructionType.hydrateElement](renderable: IRenderable, target: any, instruction: Immutable<IHydrateElementInstruction>): void {
    const context = this.context;
    const operation = context.beginComponentOperation(renderable, target, instruction, null, null, target, true);    const component = context.get<ICustomElement>(CustomElementResource.keyFrom(instruction.res));

    this.hydrateElementInstance(renderable, target, instruction, component);
    operation.dispose();
  }

  public [TargetedInstructionType.hydrateAttribute](renderable: IRenderable, target: any, instruction: Immutable<IHydrateAttributeInstruction>): void {
    const childInstructions = instruction.instructions;
    const context = this.context;

    const operation = context.beginComponentOperation(renderable, target, instruction);
    const component = context.get<ICustomAttribute>(CustomAttributeResource.keyFrom(instruction.res));
    component.$hydrate(this.renderingEngine);

    for (let i = 0, ii = childInstructions.length; i < ii; ++i) {
      const current = childInstructions[i];
      (this as any)[current.type](renderable, component, current);
    }

    renderable.$bindables.push(component);
    renderable.$attachables.push(component);

    operation.dispose();
  }

  public [TargetedInstructionType.hydrateTemplateController](renderable: IRenderable, target: any, instruction: Immutable<IHydrateTemplateController>, parts?: TemplatePartDefinitions): void {
    const childInstructions = instruction.instructions;
    const factory = this.renderingEngine.getViewFactory(instruction.src, this.context);
    const context = this.context;
    const operation = context.beginComponentOperation(renderable, target, instruction, factory, parts, DOM.convertToRenderLocation(target), false);

    const component = context.get<ICustomAttribute>(CustomAttributeResource.keyFrom(instruction.res));
    component.$hydrate(this.renderingEngine);

    if (instruction.link) {
      (component as any).link(renderable.$attachables[renderable.$attachables.length - 1]);
    }

    for (let i = 0, ii = childInstructions.length; i < ii; ++i) {
      const current = childInstructions[i];
      (this as any)[current.type](renderable, component, current);
    }

    renderable.$bindables.push(component);
    renderable.$attachables.push(component);

    operation.dispose();
  }

  public [TargetedInstructionType.renderStrategy](renderable: IRenderable, target: any, instruction: Immutable<IRenderStrategyInstruction>): void {
    const strategyName = instruction.name;
    if (this[strategyName] === undefined) {
      const strategy = this.context.get(RenderStrategyResource.keyFrom(strategyName)) as IRenderStrategy;
      if (strategy === null || strategy === undefined) {
        throw new Error(`Unknown renderStrategy "${strategyName}"`);
      }
      this[strategyName] = strategy.render.bind(strategy);
    }
    this[strategyName](renderable, target, instruction);
  }

  public [TargetedInstructionType.letElement](renderable: IRenderable, target: any, instruction: Immutable<ILetElementInstruction>): void {
    target.remove();
    const childInstructions = instruction.instructions;
    const toViewModel = instruction.toViewModel;
    for (let i = 0, ii = childInstructions.length; i < ii; ++i) {
      const childInstruction = childInstructions[i];
      const srcOrExpr: any = childInstruction.srcOrExpr;
      renderable.$bindables.push(new LetBinding(
        srcOrExpr.$kind ? srcOrExpr : this.parser.parse(srcOrExpr, BindingType.IsPropertyCommand),
        childInstruction.dest,
        this.observerLocator,
        this.context,
        toViewModel
      ));
    }
  }
}

const enum NodeTypes {
  ELEMENT = 1,
  TEXT = 3,
}

function nodesToPixiElements(nodes: ArrayLike<INode>, parent: PIXI.Container = null): PIXI.DisplayObject[] {
  const results: PIXI.DisplayObject[] = [];
  for (let i = 0, ii = nodes.length; ii > i; ++i) {
    const node = nodes[i];
    let pixiElement: PIXI.DisplayObject | null = null;
    switch ((node as Node).nodeType) {
      case NodeTypes.ELEMENT:
        pixiElement = DOM.pixi.createPixiElement((nodes[i] as Node).nodeName.toLowerCase());
        break;
      case NodeTypes.TEXT:
        pixiElement = new PIXI.Text((node as Text).textContent);
        break;
    }
    if (pixiElement === null) {
      continue;
    }
    if (parent !== null) {
      parent.addChild(pixiElement);
    }
    node['$pixi'] = pixiElement;
    results[i] = pixiElement;
    if (node.childNodes) {
      if (pixiElement instanceof PIXI.Container) {
        nodesToPixiElements(node.childNodes, pixiElement);
      } else {
        throw new Error(
          `Invalid object model. ${(node as Node).nodeName.toLowerCase()} is not an instance of PIXI.Container. Cannot have childnodes`
        );
      }
    }
  }
  return results;
}