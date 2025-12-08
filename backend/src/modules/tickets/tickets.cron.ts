import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TicketsService } from './tickets.service';

/**
 * Cron job service for ticket-related scheduled tasks
 * Handles automatic expiration of tickets
 */
@Injectable()
export class TicketsCron {
  private readonly logger = new Logger(TicketsCron.name);

  constructor(private readonly ticketsService: TicketsService) {}

  /**
   * Runs daily at midnight to update expired tickets
   * Uses CronExpression.EVERY_DAY_AT_MIDNIGHT (0 0 * * *)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'update-expired-tickets',
    timeZone: 'Europe/Budapest',
  })
  async handleExpiredTickets(): Promise<void> {
    this.logger.log('Starting expired tickets cleanup job');

    try {
      await this.ticketsService.updateExpiredTickets();
      this.logger.log('Expired tickets cleanup job completed successfully');
    } catch (error) {
      this.logger.error(
        `Expired tickets cleanup job failed: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Optional: Run every hour to catch recently expired tickets faster
   * Uncomment if you want more frequent updates
   */
  // @Cron(CronExpression.EVERY_HOUR, {
  //   name: 'update-expired-tickets-hourly',
  //   timeZone: 'Europe/Budapest',
  // })
  // async handleExpiredTicketsHourly(): Promise<void> {
  //   this.logger.log('Starting hourly expired tickets cleanup job');
  //
  //   try {
  //     await this.ticketsService.updateExpiredTickets();
  //     this.logger.log('Hourly expired tickets cleanup job completed successfully');
  //   } catch (error) {
  //     this.logger.error(
  //       `Hourly expired tickets cleanup job failed: ${error.message}`,
  //       error.stack,
  //     );
  //   }
  // }
}
