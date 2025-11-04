import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', description: 'Az API státusza' })
  status: string;

  @ApiProperty({ example: '2025-11-02T10:00:00Z', description: 'Szerver idő' })
  timestamp: string;

  @ApiProperty({ example: '0.1.0', description: 'API verzió' })
  version: string;

  @ApiProperty({
    example: { database: 'connected', storage: 'connected' },
    description: 'Kapcsolódó szolgáltatások státusza',
  })
  services: {
    database: string;
    storage: string;
  };
}
