import { Injectable } from '@nestjs/common';
import { AppError } from '@modules/utils/app_error';
import { IGeocodingService } from '../interface/IGeocoding.service';

@Injectable()
export class GeoapifyGeocodingService implements IGeocodingService {
  private readonly api_url = 'https://api.geoapify.com/v1/geocode/search';

  async geocode(address: {
    street: string;
    number: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
  }): Promise<{
    latitude: number;
    longitude: number;
  }> {
    const api_key = process.env.GEOAPIFY_API_KEY;
    if (!api_key) throw new Error('GEOAPIFY_API_KEY não configurada');
    const params = new URLSearchParams({
      street: address.street,
      housenumber: address.number,
      postcode: address.zip_code,
      city: address.city,
      state: address.state,
      country: address.country,
      format: 'json',
      limit: '1',
      apiKey: api_key,
    });
    const response = await fetch(`${this.api_url}?${params}`);
    if (!response.ok)
      throw new AppError('Não foi possível localizar o endereço.', 502);
    const data = await response.json();
    if (!data.results?.length)
      throw new AppError(
        'Não foi possível localizar o endereço informado.',
        400,
      );
    const result = data.results[0];
    return {
      latitude: result.lat,
      longitude: result.lon,
    };
  }
}
