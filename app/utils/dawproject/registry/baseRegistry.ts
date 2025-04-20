export interface BaseConstructor<T> {
  new (...args: any[]): T;
  fromXmlObject(xmlObject: any): T;
}

export abstract class BaseRegistry<T> {
  private static registries: {
    [key: string]: { [key: string]: BaseConstructor<any> };
  } = {};

  constructor(protected readonly registryName: string) {}

  register(tagName: string, classType: BaseConstructor<T>): void {
    if (!BaseRegistry.registries[this.registryName]) {
      BaseRegistry.registries[this.registryName] = {};
    }
    BaseRegistry.registries[this.registryName][tagName] = classType;
  }

  get(tagName: string): BaseConstructor<T> | undefined {
    if (!BaseRegistry.registries[this.registryName]) {
      return undefined;
    }
    return BaseRegistry.registries[this.registryName][tagName];
  }

  protected getRegistry(): { [key: string]: BaseConstructor<T> } {
    if (!BaseRegistry.registries[this.registryName]) {
      BaseRegistry.registries[this.registryName] = {};
    }
    return BaseRegistry.registries[this.registryName];
  }
}
