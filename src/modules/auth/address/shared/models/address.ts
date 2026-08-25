import { randomUUID } from 'crypto';
import { Replace } from '@utils/helper';

export interface Address_Props {
  created_at: Date;
  updated_at: Date;
  entity_id: string;
  zip_code: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
  country: string;
  latitude: number;
  longitude: number;
}

export class Address {
  private id: string;
  private props: Address_Props;

  constructor(
    props: Replace<
      Address_Props,
      {
        created_at?: Date;
        updated_at?: Date;
        complement?: string;
      }
    >,
    id?: string,
  ) {
    this.id = id ?? randomUUID();
    this.props = {
      ...props,
      created_at: props.created_at ?? new Date(),
      updated_at: props.updated_at ?? new Date(),
      complement: props.complement ?? null,
    };
  }

  public get _id() {
    return this.id;
  }

  public get longitude(): number {
    return this.props.longitude;
  }

  public set longitude(longitude: number) {
    this.props.longitude = longitude;
  }

  public get latitude(): number {
    return this.props.latitude;
  }

  public set latitude(latitude: number) {
    this.props.latitude = latitude;
  }

  public get country(): string {
    return this.props.country;
  }

  public set country(country: string) {
    this.props.country = country;
  }

  public get state(): string {
    return this.props.state;
  }

  public set state(state: string) {
    this.props.state = state;
  }

  public get entity_id(): string {
    return this.props.entity_id;
  }

  public set entity_id(entity_id: string) {
    this.props.entity_id = entity_id;
  }

  public get complement(): string {
    return this.props.complement;
  }

  public set complement(complement: string) {
    this.props.complement = complement;
  }

  public get zip_code(): string {
    return this.props.zip_code;
  }

  public set zip_code(zip_code: string) {
    this.props.zip_code = zip_code;
  }

  public get created_at(): Date {
    return this.props.created_at;
  }

  public set created_at(created_at: Date) {
    this.props.created_at = created_at;
  }

  public get updated_at(): Date {
    return this.props.updated_at;
  }

  public set updated_at(updated_at: Date) {
    this.props.updated_at = updated_at;
  }

  public get street(): string {
    return this.props.street;
  }

  public set street(street: string) {
    this.props.street = street;
  }

  public get number(): string {
    return this.props.number;
  }

  public set number(number: string) {
    this.props.number = number;
  }

  public get neighborhood(): string {
    return this.props.neighborhood;
  }

  public set neighborhood(neighborhood: string) {
    this.props.neighborhood = neighborhood;
  }

  public get city(): string {
    return this.props.city;
  }

  public set city(city: string) {
    this.props.city = city;
  }
}
