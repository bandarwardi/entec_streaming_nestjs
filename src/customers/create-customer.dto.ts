export class CustomerSubscriptionDto {
  name: string;
  username: string;
  playlistName?: string;
  password: string;
  host: string;
  status?: string;
  appActive?: boolean;
  appExpiry?: Date | string | null;
  playlistPin?: string;
}

export class CreateCustomerDto {
  name: string;
  subscriptions?: CustomerSubscriptionDto[];
}

export class AddDeviceToCustomerDto {
  macAddress: string;
  deviceKey: string;
}
