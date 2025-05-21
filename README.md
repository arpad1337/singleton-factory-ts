# singleton-factory-ts

Singleton base class and Factory for Dependency Injection

## Usage

```typescript

  class S1 extends Singleton {
    ...
  }

  class S2 extends Singleton {
    static get Dependencies(): [SingletonClassType<S1>] {
      return [S1];
    }

    constructor(protected _s1: S1) {
      super();
    }

    ...
  }

  ...
  const s2 = S2.instance;
  ...

```

## Author

@arpad1337

## License

MIT
