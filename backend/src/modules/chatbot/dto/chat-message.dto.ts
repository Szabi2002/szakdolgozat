import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsArray } from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({
    description: 'The user message to send to the chatbot',
    example: 'Mikor megy a következő 7-es busz a Blaha Lujza térről?',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;

  @ApiProperty({
    description: 'Previous conversation history (optional)',
    required: false,
    type: [Object],
  })
  @IsOptional()
  @IsArray()
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export class ChatResponseDto {
  @ApiProperty({
    description: 'The chatbot response message',
    example: 'A 7-es busz a Blaha Lujza térről kb. 5-10 percenként indul. A pontos menetrend függ az időponttól.',
  })
  response: string;

  @ApiProperty({
    description: 'Whether the response was generated successfully',
  })
  success: boolean;

  @ApiProperty({
    description: 'Error message if any',
    required: false,
  })
  error?: string;
}
