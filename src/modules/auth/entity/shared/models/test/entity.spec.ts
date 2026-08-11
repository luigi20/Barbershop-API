import { EntityStatus, EntityType } from '@modules/utils/enum';
import { Entity } from '../entity';

describe('Create Entity', () => {
  it('should be able to create a entity', () => {
    const entity = new Entity({
      email: 'luisfoco@gmail.com',
      name: 'brutal',
      status: EntityStatus.PENDENTE,
      type: EntityType.BARBEARIA,
    });
    expect(entity).toBeTruthy();
  });
});
