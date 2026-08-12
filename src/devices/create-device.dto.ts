export class CreateDeviceDto {
  macAddress: string;
  deviceKey: string;
  username: string;
  password: string;
  hostId?: string;
}
