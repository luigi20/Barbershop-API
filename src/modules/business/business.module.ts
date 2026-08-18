import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PlanGetAllController } from './use_cases/plan/get_all/controller/plan_get_all.controller';
import { PlanGetOneController } from './use_cases/plan/get_one/controller/plan_get_one.controller';
import { PlanUpdateController } from './use_cases/plan/update/controller/plan_update.controller';
import { PlanCreateController } from './use_cases/plan/create/controller/plan_create.controller';
import { PlanCreateService } from './use_cases/plan/create/service/plan_create.service';
import { PlanUpdateService } from './use_cases/plan/update/service/plan_update.service';
import { PlanGetAllService } from './use_cases/plan/get_all/service/plan_get_all.service';
import { PlanGetOneService } from './use_cases/plan/get_one/service/plan_get_one.service';
import { SubscriptionCreateController } from './use_cases/subscription/create/controller/subscription_create.controller';
import { SubscriptionGetOneController } from './use_cases/subscription/get_one/controller/subscription_get_one.controller';
import { SubscriptionGetAllController } from './use_cases/subscription/get_all/controller/subscription_get_all.controller';
import { SubscriptionUpdateController } from './use_cases/subscription/update/controller/subscription_update.controller';
import { SubscriptionGetAllService } from './use_cases/subscription/get_all/service/subscription_get_all.service';
import { SubscriptionUpdateService } from './use_cases/subscription/update/service/subscription_update.service';
import { SubscriptionCreateService } from './use_cases/subscription/create/service/subscription_create.service';
import { SubscriptionGetOneService } from './use_cases/subscription/get_one/service/subscription_get_one.service';
import { IPlanRepository } from './plan/shared/repositories/abstract_class/iplan-repository';
import { PlanRepository } from './plan/shared/repositories/plan-repository';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { EntityRepository } from '@modules/auth/entity/shared/repositories/entity-repository';
import { ISubscriptionRepository } from './subscription/shared/repositories/abstract_class/isubscription-repository';
import { SubscriptionRepository } from './subscription/shared/repositories/subscription-repository';

@Module({
  imports: [
    JwtModule.register({
      privateKey: process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      publicKey: process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n'),
      signOptions: {
        algorithm: 'RS256',
        expiresIn: '1d',
      },
    }),
  ],
  controllers: [
    PlanUpdateController,
    PlanCreateController,
    PlanGetAllController,
    PlanGetOneController,
    SubscriptionCreateController,
    SubscriptionUpdateController,
    SubscriptionGetAllController,
    SubscriptionGetOneController,
  ],
  providers: [
    PlanCreateService,
    PlanUpdateService,
    PlanGetAllService,
    PlanGetOneService,
    SubscriptionCreateService,
    SubscriptionUpdateService,
    SubscriptionGetAllService,
    SubscriptionGetOneService,
    {
      provide: IPlanRepository,
      useClass: PlanRepository,
    },
    {
      provide: IEntityRepository,
      useClass: EntityRepository,
    },
    {
      provide: ISubscriptionRepository,
      useClass: SubscriptionRepository,
    },
  ],
  exports: [JwtModule, BusinessModule],
})
export class BusinessModule {}
