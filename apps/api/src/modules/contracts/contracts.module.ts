import { Module } from '@nestjs/common';

import { ClientsModule } from '../clients/clients.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { ContractsController } from './contracts.controller';
import { ContractsRepository } from './contracts.repository';
import { ContractsService } from './contracts.service';

@Module({
  imports: [VehiclesModule, ClientsModule],
  controllers: [ContractsController],
  providers: [ContractsService, ContractsRepository],
  exports: [ContractsService],
})
export class ContractsModule {}
