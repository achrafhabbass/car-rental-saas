import { IsEnum } from 'class-validator';
import { ReservationPaymentStatus } from '@prisma/client';

export class UpdateReservationPaymentStatusDto {
  @IsEnum(ReservationPaymentStatus)
  paymentStatus!: ReservationPaymentStatus;
}
