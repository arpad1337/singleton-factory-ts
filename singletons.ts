const g = global || window || self || { Object };

function respondsToSelector(
  object: Object,
  selector: string | symbol | number
): boolean {
  return (
    !!Reflect.get(object, selector) &&
    typeof Reflect.get(object, selector) === "function"
  );
}

Object.defineProperty(g.Object, "respondsToSelector", {
  enumerable: false,
  writable: false,
  value: respondsToSelector,
});

Object.defineProperty(g.Object.prototype, "respondsToSelector", {
  enumerable: false,
  writable: false,
  value: function (selector: string | symbol | number): boolean {
    return respondsToSelector(this, selector);
  },
});

export interface IHasInstanceGetter<T> {
  get instance(): T;
}

export interface IObjectHasCreate<T> {
  create?(...args: any[]): T;
}

export interface IObjectRespondsToSelector {
  respondsToSelector(selector: string | symbol | number): boolean;
}

export interface ISingletonStatic<T>
  extends IHasInstanceGetter<T>,
    IObjectRespondsToSelector,
    IObjectHasCreate<T> {
  get InjectorToken(): symbol;
  get Dependencies(): SingletonClassType<any>[];
  get className(): string;
}

export type Constructor<T> = new (...args: any[]) => T;

export type SingletonClassType<T> = ISingletonStatic<T> & Constructor<T>;

export abstract class Singleton {
  protected static get Type() {
    return this;
  }

  public static get InjectorToken(): symbol {
    return Symbol.for(this.className);
  }

  public get className() {
    return this.constructor.name;
  }

  public static get className(): string {
    return this.name;
  }

  public static get Dependencies(): SingletonClassType<any>[] {
    return [];
  }

  public respondsToSelector(selector: string | symbol | number): boolean {
    return Object.respondsToSelector(this, selector);
  }

  public static respondsToSelector(
    selector: string | symbol | number
  ): boolean {
    return Object.respondsToSelector(this, selector);
  }

  public static get instance(): any {
    try {
      const self = SingletonFactory.instance
        .getOrCreate(this as unknown as SingletonClassType<Singleton>)
        .castToSelf();
      return self;
    } catch (e) {
      throw e;
    }
  }

  public castToSelf<T extends this>(Self?: Constructor<T>) {
    if (!!Self && !(this instanceof Self)) {
      throw new Error(
        `${this.className}->castToSelf Assertation failed, can't cast to ${Self.name}`
      );
    }
    return this as T;
  }
}

export class SingletonFactory extends Singleton {
  protected static _singleton: SingletonFactory | undefined = undefined;

  protected _singletonCache: Map<symbol, any> = new Map<symbol, any>();
  protected _initializingClasses: Set<symbol> = new Set();

  getOrCreate<Self extends Singleton = Singleton>(
    SingletonClass: SingletonClassType<Self>
  ): Self {
    if (this._initializingClasses.has(SingletonClass.InjectorToken)) {
      const err = new Error(
        `${
          this.className
        }->getOrCreate Circular dependency detected for token ${SingletonClass.InjectorToken.toString()}`
      )
      throw err;
    }
    let instance: Self;
    if (this._singletonCache.has(SingletonClass.InjectorToken)) {
      instance = this._singletonCache.get(SingletonClass.InjectorToken)!;
    } else {
      this._initializingClasses.add(SingletonClass.InjectorToken);
      const deps: Singleton[] = [];
      for (let DependencyClass of SingletonClass.Dependencies) {
        try {
          const instance: Singleton = this.getOrCreate(DependencyClass);
          deps.push(instance);
        } catch (e) {
          throw e;
        }
      }
      if (SingletonClass.respondsToSelector("create")) {
        instance = SingletonClass.create!(...deps);
      } else {
        instance = new SingletonClass(...deps);
      }

      // do additional stuff here (e.g. attach logger)
    
      this._singletonCache.set(SingletonClass.InjectorToken, instance);
      this._initializingClasses.delete(SingletonClass.InjectorToken);
    }
    return instance;
  }

  static get instance(): SingletonFactory {
    if (!this._singleton) {
      this._singleton = new this();
    }
    return this._singleton;
  }
}
