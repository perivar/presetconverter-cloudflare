import { Device, DeviceConstructor } from "../device/device";
import { BaseRegistry } from "./baseRegistry";

export class DeviceRegistry extends BaseRegistry<Device> {
  private static instance: DeviceRegistry;

  private constructor() {
    super("device");
  }

  static getInstance(): DeviceRegistry {
    if (!DeviceRegistry.instance) {
      DeviceRegistry.instance = new DeviceRegistry();
    }
    return DeviceRegistry.instance;
  }

  static register(tagName: string, deviceClass: DeviceConstructor): void {
    DeviceRegistry.getInstance().register(tagName, deviceClass);
  }

  static getDeviceClass(tagName: string): DeviceConstructor | undefined {
    return DeviceRegistry.getInstance().get(tagName);
  }
}

export function registerDevice(tagName: string) {
  return function (target: DeviceConstructor) {
    DeviceRegistry.register(tagName, target);
  };
}
