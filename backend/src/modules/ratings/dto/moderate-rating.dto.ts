import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO for moderating a rating (admin only)
 * Allows approving or rejecting pending ratings
 */
export class ModerateRatingDto {
  @ApiProperty({
    description: 'New status for the rating',
    enum: ['approved', 'rejected'],
    example: 'approved',
  })
  @IsEnum(['approved', 'rejected'], {
    message: 'status must be either "approved" or "rejected"',
  })
  status: 'approved' | 'rejected';

  @ApiProperty({
    description: 'Optional reason for rejection (recommended if rejecting)',
    example: 'Contains inappropriate language',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'reason must be a string' })
  @MaxLength(500, { message: 'reason must not exceed 500 characters' })
  reason?: string;
}
