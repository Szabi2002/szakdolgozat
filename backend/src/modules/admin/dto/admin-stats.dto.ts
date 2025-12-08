import { ApiProperty } from '@nestjs/swagger';

export class RatingsDistributionDto {
  @ApiProperty({ description: 'Number of approved ratings', example: 300 })
  approved: number;

  @ApiProperty({ description: 'Number of pending ratings', example: 5 })
  pending: number;

  @ApiProperty({ description: 'Number of rejected ratings', example: 15 })
  rejected: number;
}

export class MonthlyRegistrationDto {
  @ApiProperty({ description: 'Month in YYYY-MM format', example: '2025-01' })
  month: string;

  @ApiProperty({ description: 'Number of users registered in this month', example: 12 })
  count: number;
}

export class AdminStatsDto {
  @ApiProperty({ description: 'Total number of users', example: 150 })
  totalUsers: number;

  @ApiProperty({ description: 'Number of new users this month', example: 12 })
  newUsersThisMonth: number;

  @ApiProperty({ description: 'Number of pending ratings', example: 5 })
  pendingRatings: number;

  @ApiProperty({ description: 'Number of pending reports', example: 8 })
  pendingReports: number;

  @ApiProperty({ description: 'Number of active tickets', example: 450 })
  activeTickets: number;

  @ApiProperty({
    description: 'Monthly registration statistics for the last 12 months',
    type: [MonthlyRegistrationDto]
  })
  monthlyRegistrations: MonthlyRegistrationDto[];

  @ApiProperty({
    description: 'Ratings status distribution',
    type: RatingsDistributionDto
  })
  ratingsStatusDistribution: RatingsDistributionDto;
}
