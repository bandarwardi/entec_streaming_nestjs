export class CustomerSubscriptionDto {
  name: string;
  username: string;
  password: string;
  host: string;
  status?: string;
  appActive?: boolean;
  appExpiry?: Date | string | null;
}

export class CreateCustomerDto {
  name: string;
  subscriptions?: CustomerSubscriptionDto[];
}

export class AddDeviceToCustomerDto {
  macAddress: string;
  deviceKey: string;
}
