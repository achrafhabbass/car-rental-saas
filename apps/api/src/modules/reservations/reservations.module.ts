import { Module } from '@nestjs/common';

import { BillingModule } from '../billing/billing.module';
import { ClientsModule } from '../clients/clients.module';
import { ContractsModule } from '../contracts/contracts.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { OverdueReservationsSweeper } from './overdue.sweeper';
import { ReservationsController } from './reservations.controller';
import { ReservationsRepository } from './reservations.repository';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [VehiclesModule, ClientsModule, ContractsModule, BillingModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsRepository, OverdueReservationsSweeper],
  exports: [ReservationsService, ReservationsRepository, OverdueReservationsSweeper],
})
export class ReservationsModule {}
