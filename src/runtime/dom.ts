import { DI, IContainer, IResolver, PLATFORM } from '@aurelia/kernel';

export interface INodeLike {
  readonly firstChild: INode | null;
  readonly lastChild: INode | null;
  readonly childNodes: ArrayLike<INode>;
}

export interface INode extends INodeLike {
  readonly parentNode: INode | null;
  readonly nextSibling: INode | null;
  readonly previousSibling: INode | null;
}

export const INode = DI.createInterface<INode>().noDefault();

export interface IRenderLocation extends PIXI.DisplayObject { }


export const IRenderLocation = DI.createInterface<IRenderLocation>().noDefault();

/**
 * Represents a DocumentFragment
 */
export interface INodeSequence extends INodeLike {
  /**
   * The nodes of this sequence.
   */
  childNodes: ReadonlyArray<INode>;
  /**
   * The pixi object representing the html tree
   */
  pixiNodes: ReadonlyArray<PIXI.DisplayObject>;

  /**
   * Find all instruction targets in this sequence.
   */
  findTargets(): ArrayLike<INode> | ReadonlyArray<INode>;

  findPixiTargets(): ReadonlyArray<PIXI.DisplayObject>;

  /**
   * Insert this sequence as a sibling before refNode
   */
  insertBefore(refNode: PIXI.DisplayObject): void;

  /**
   * Append this sequence as a child to parent
   */
  appendTo(parent: PIXI.Container): void;

  /**
   * Remove this sequence from its parent.
   */
  remove(): void;
}

export interface INodeObserver {
  disconnect(): void;
}

/*@internal*/
export function createNodeSequenceFromFragment(fragment: DocumentFragment): INodeSequence {
  return new FragmentNodeSequence(<DocumentFragment>fragment.cloneNode(true));
}

// pre-declare certain functions whose behavior depends on a once-checked global condition for better performance
function returnTrue(): true {
  return true;
}

function returnFalse(): false {
  return false;
}

function removeNormal(node: Element): void {
  node.remove();
}

function removePolyfilled(node: Element): void {
  // not sure if we still actually need this, this used to be an IE9/10 thing
  node.parentNode.removeChild(node);
}

const PixiDomMap: Record<string, () => PIXI.DisplayObject> = {};

export const DOM = {
  pixi: {
    remove(node: PIXI.DisplayObject) {
      if (node.parent) {
        node.parent.removeChild(node);
      }
    },
    map(tagName: string, ctor: (() => PIXI.DisplayObject)): void {
      if (tagName in PixiDomMap) {
        throw new Error(`Pixi element with the same name "${tagName}" already exists`);
      }
      PixiDomMap[tagName] = ctor;
    },
    createPixiElement(tagName: string): PIXI.DisplayObject {
      return PixiDomMap[tagName]();
    },
  },
  createFactoryFromMarkupOrNode(markupOrNode: string | INode): () => INodeSequence {
    let template: HTMLTemplateElement;
    if (markupOrNode instanceof Node) {
      if ((<HTMLTemplateElement>markupOrNode).content) {
        template = markupOrNode as any;
      } else {
        template = DOM.createTemplate() as any;
        template.content.appendChild(<Node>markupOrNode);
      }
    } else {
      template = DOM.createTemplate() as any;
      template.innerHTML = <string>markupOrNode;
    }

    // bind performs a bit better and gives a cleaner closure than an arrow function
    return createNodeSequenceFromFragment.bind(null, template.content);
  },

  createElement(name: string): INode {
    return document.createElement(name);
  },

  createText(text: string): INode {
    return document.createTextNode(text);
  },

  createNodeObserver(target: INode, callback: MutationCallback, options: MutationObserverInit) {
    const observer = new MutationObserver(callback);
    observer.observe(target as Node, options);
    return observer;
  },

  attachShadow(host: PIXI.Container, options: ShadowRootInit): PIXI.Container {
    return host.addChild(new PIXI.Container());
    // return (host as Element).attachShadow(options);
  },

  /*@internal*/
  createTemplate(): INode {
    return document.createElement('template');
  },

  cloneNode(node: INode, deep?: boolean): INode {
    return (<Node>node).cloneNode(deep !== false); // use true unless the caller explicitly passes in false
  },

  migrateChildNodes(currentParent: INode, newParent: INode): void {
    const append = DOM.appendChild;
    while (currentParent.firstChild) {
      append(newParent, currentParent.firstChild);
    }
  },

  isNodeInstance(potentialNode: any): potentialNode is INode {
    return potentialNode instanceof Node;
  },

  isElementNodeType(node: INode): boolean {
    return (<Node>node).nodeType === 1;
  },

  isTextNodeType(node: INode): boolean {
    return (<Node>node).nodeType === 3;
  },

  remove(node: INode): void {
    // only check the prototype once and then permanently set a polyfilled or non-polyfilled call to save a few cycles
    if (Element.prototype.remove === undefined) {
      (DOM.remove = removePolyfilled)(<Element>node);
    } else {
      (DOM.remove = removeNormal)(<Element>node);
    }
  },

  replaceNode(newChild: INode, oldChild: INode): void {
    if (oldChild.parentNode) {
      (<Node>oldChild.parentNode).replaceChild(<Node>newChild, <Node>oldChild);
    }
  },

  appendChild(parent: INode, child: INode): void {
    (<Node>parent).appendChild(<Node>child);
  },

  insertBefore(nodeToInsert: INode, referenceNode: INode): void {
    (<Node>referenceNode.parentNode).insertBefore(<Node>nodeToInsert, <Node>referenceNode);
  },

  getAttribute(node: INode, name: string): any {
    return (<Element>node).getAttribute(name);
  },

  setAttribute(node: INode, name: string, value: any): void {
    (<Element>node).setAttribute(name, value);
  },

  removeAttribute(node: INode, name: string): void {
    (<Element>node).removeAttribute(name);
  },

  hasClass(node: INode, className: string): boolean {
    return (<Element>node).classList.contains(className);
  },

  addClass(node: INode, className: string): void {
    (<Element>node).classList.add(className);
  },

  removeClass(node: INode, className: string): void {
    (<Element>node).classList.remove(className);
  },

  addEventListener(eventName: string, subscriber: any, publisher?: INode, options?: any) {
    (<Node>publisher || document).addEventListener(eventName, subscriber, options);
  },

  removeEventListener(eventName: string, subscriber: any, publisher?: INode, options?: any) {
    (<Node>publisher || document).removeEventListener(eventName, subscriber, options);
  },

  isAllWhitespace(node: INode): boolean {
    if ((<any>node).auInterpolationTarget === true) {
      return false;
    }
    const text = (node as Node).textContent;
    const len = text.length;
    let i = 0;
    // for perf benchmark of this compared to the regex method: http://jsben.ch/p70q2 (also a general case against using regex)
    while (i < len) {
      // tslint:disable-next-line:max-line-length
      // charCodes 0-0x20(32) can all be considered whitespace (non-whitespace chars in this range don't have a visual representation anyway)
      if (text.charCodeAt(i) > 0x20) {
        return false;
      }
      i++;
    }
    return true;
  },

  treatAsNonWhitespace(node: INode): void {
    // see isAllWhitespace above
    (<any>node).auInterpolationTarget = true;
  },

  convertToRenderLocation(node: PIXI.DisplayObject): IRenderLocation {
    // const location = document.createComment('au-loc');
    // // let this throw if node does not have a parent
    // (<Node>node.parentNode).replaceChild(location, <any>node);
    // return location;
    const location = new PIXI.DisplayObject();
    const idx = node.parent.getChildIndex(node);
    node.parent.addChildAt(location, idx);
    node.parent.removeChild(node);
    return location;
  },

  registerElementResolver(container: IContainer, resolver: IResolver): void {
    container.registerResolver(INode, resolver);
    container.registerResolver(Element, resolver);
    container.registerResolver(HTMLElement, resolver);
    container.registerResolver(SVGElement, resolver);
  }
};

// This is an implementation of INodeSequence that represents "no DOM" to render.
// It's used in various places to avoid null and to encode
// the explicit idea of "no view".
const emptySequence: INodeSequence = {
  firstChild: null,
  lastChild: null,
  childNodes: PLATFORM.emptyArray,
  pixiNodes: PLATFORM.emptyArray,
  findTargets() { return PLATFORM.emptyArray; },
  findPixiTargets() { return PLATFORM.emptyArray },
  insertBefore(refNode: PIXI.DisplayObject): void {},
  appendTo(parent: PIXI.Container): void {},
  remove(): void {}
};

export const NodeSequence = {
  empty: emptySequence
};

// This is the most common form of INodeSequence.
// Every custom element or template controller whose node sequence is based on an HTML template
// has an instance of this under the hood. Anyone who wants to create a node sequence from
// a string of markup would also receive an instance of this.
// CompiledTemplates create instances of FragmentNodeSequence.
/*@internal*/
export class FragmentNodeSequence implements INodeSequence {
  public firstChild: Node;
  public lastChild: Node;
  public childNodes: Node[];
  public pixiNodes: PIXI.DisplayObject[];

  private fragment: DocumentFragment;

  constructor(fragment: DocumentFragment) {
    this.fragment = fragment;
    this.firstChild = fragment.firstChild;
    this.lastChild = fragment.lastChild;
    this.childNodes = PLATFORM.toArray(fragment.childNodes);
    this.pixiNodes = nodesToPixiElements(this.childNodes);
  }

  public findTargets(): ArrayLike<Node> {
    return this.fragment.querySelectorAll('.au');
  }

  public findPixiTargets(): ReadonlyArray<PIXI.DisplayObject> {
    return Array.from(this.findTargets(), node => node['$pixi']);
  }

  public insertBefore(refNode: PIXI.DisplayObject): void {
    // refNode.parentNode.insertBefore(this.fragment, refNode);
    // refNode.parent.addChildAt(this.pixiNodes)
  }

  public appendTo(parent: PIXI.Container): void {
    // parent.appendChild(this.fragment);
    if (this.pixiNodes.length) {
      parent.addChild(...this.pixiNodes);
    }
  }

  public remove(): void {
    const fragment = this.fragment;
    let current = this.firstChild;

    if (current.parentNode !== fragment) {
      // this bind is a small perf tweak to minimize member accessors
      const append = fragment.appendChild.bind(fragment);
      const end = this.lastChild;
      let next: Node;

      while (current) {
        next = current.nextSibling;
        append(current);

        if (current === end) {
          break;
        }

        current = next;
      }
    }
  }
}

const enum NodeTypes {
  ELEMENT = 1,
  TEXT = 3,
}

function nodesToPixiElements(nodes: Node[] | NodeListOf<Node>, parent: PIXI.Container = null): PIXI.DisplayObject[] {
  const results = [];
  for (let i = 0, ii = nodes.length; ii > i; ++i) {
    const node = nodes[i];
    let pixiElement: PIXI.DisplayObject | null = null;
    switch (node.nodeType) {
      case NodeTypes.ELEMENT:
        pixiElement = DOM.pixi.createPixiElement(nodes[i].nodeName.toLowerCase());
        break;
      case NodeTypes.TEXT:
        pixiElement = new PIXI.Text(node.textContent);
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
    if (node.childNodes.length > 0) {
      if (pixiElement instanceof PIXI.Container) {
        nodesToPixiElements(node.childNodes, pixiElement);
      } else {
        throw new Error(
          `Invalid object model. ${node.nodeName.toLowerCase()} is not an instance of PIXI.Container. Cannot have childnodes`
        );
      }
    }
  }
  return results;
}
