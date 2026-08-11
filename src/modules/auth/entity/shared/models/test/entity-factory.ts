import { EntityStatus, EntityType } from '@modules/utils/enum';
import { Entity_Props, Entity } from '../entity';

type FactoryParams = {
  id?: string;
  props?: Override;
};
type Override = Partial<Entity_Props>;
export function makeEntity({ id, props }: FactoryParams = {}) {
  return new Entity(
    {
      email: 'luisfoco@gmail.com',
      name: 'brutal',
      status: EntityStatus.BLOQUEADO,
      type: EntityType.BARBEARIA,
      ...props,
    },
    id,
  );
}
