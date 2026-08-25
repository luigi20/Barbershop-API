export abstract class IGeocodingService {
  abstract geocode(address: {
    street: string;
    number: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
  }): Promise<{
    latitude: number;
    longitude: number;
  }>;
}
