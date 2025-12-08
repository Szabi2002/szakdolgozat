import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { ChatMessageDto, ChatResponseDto } from './dto/chat-message.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('chatbot')
@Controller('chatbot')
@ApiBearerAuth()
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send a message to the AI chatbot',
    description: 'Send a message and receive an AI-generated response about Budapest public transport',
  })
  @ApiResponse({
    status: 200,
    description: 'Message processed successfully',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - user not authenticated',
  })
  async sendMessage(
    @CurrentUser() user: any,
    @Body() dto: ChatMessageDto,
  ): Promise<ChatResponseDto> {
    return this.chatbotService.sendMessage(dto, user.id);
  }
}
