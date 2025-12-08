import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '@common/supabase/supabase.service';
import { ChatMessageDto, ChatResponseDto } from './dto/chat-message.dto';

interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  error?: {
    message: string;
  };
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  // Using DeepSeek R1T2 Chimera (free tier, fast responses)
  private readonly model = 'tngtech/deepseek-r1t2-chimera:free';

  // Cache for routes and stops data
  private routesCache: any[] = [];
  private stopsCache: any[] = [];
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {
    this.apiKey = this.configService.get<string>('OPENROUTER_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('OPENROUTER_API_KEY is not configured');
    } else {
      this.logger.log('Chatbot service initialized with OpenRouter API');
    }
  }

  /**
   * Send a message to the chatbot and get a response
   */
  async sendMessage(dto: ChatMessageDto, userId: string): Promise<ChatResponseDto> {
    try {
      if (!this.apiKey) {
        return {
          response: 'A chatbot szolgáltatás jelenleg nem elérhető. Kérjük, próbáld később.',
          success: false,
          error: 'API key not configured',
        };
      }

      // Refresh cache if needed
      await this.refreshDataCache();

      // Build the system prompt with transport data context
      const systemPrompt = this.buildSystemPrompt();

      // Build messages array
      const messages = [
        { role: 'system', content: systemPrompt },
        ...(dto.history || []),
        { role: 'user', content: dto.message },
      ];

      // Call OpenRouter API
      const response = await this.callOpenRouter(messages);

      return {
        response: response,
        success: true,
      };
    } catch (error) {
      this.logger.error(`Failed to process chatbot message: ${error.message}`);
      return {
        response: 'Sajnálom, hiba történt a válasz generálása közben. Kérlek, próbáld újra később.',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Build the system prompt with transport data context
   */
  private buildSystemPrompt(): string {
    // Create a condensed summary of routes for context
    const routesSummary = this.routesCache.slice(0, 50).map(r => ({
      number: r.route_number,
      name: r.name,
      type: r.route_type,
    }));

    // Create a condensed summary of stops for context
    const stopsSummary = this.stopsCache.slice(0, 100).map(s => ({
      name: s.name,
      type: s.type,
    }));

    return `Te egy intelligens asszisztens vagy a "Közlekedési Jegykezelő" alkalmazásban. Bármilyen kérdésben segíthetsz a felhasználóknak.

KÖZLEKEDÉSI ADATOK (ha releváns):
- Járatok: ${JSON.stringify(routesSummary.slice(0, 20))}
- Megállók: ${JSON.stringify(stopsSummary.slice(0, 30))}

SZABÁLYOK:
1. MINDIG magyarul válaszolj
2. Legyél kedves, segítőkész és tömör (max 2-3 mondat)
3. Közlekedési kérdéseknél használd a fenti adatokat, de bármilyen más témában is válaszolhatsz
4. Ha jegyvásárlásról kérdeznek: "Jegyeim" menüpont
5. Ha útvonalat keresnek: "Utazástervező" funkció
6. Általános kérdésekre (időjárás, hírek, tudás, stb.) is válaszolj a legjobb tudásod szerint`;
  }

  /**
   * Call the OpenRouter API
   */
  private async callOpenRouter(messages: Array<{ role: string; content: string }>): Promise<string> {
    try {
      // Some models don't support system role, so we need to handle it differently
      // Convert system message to a user/assistant context pair
      const processedMessages = this.processMessagesForModel(messages);

      const requestBody = {
        model: this.model,
        messages: processedMessages,
        temperature: 0.7,
        max_tokens: 500,
      };

      this.logger.debug(`Sending request to OpenRouter: ${JSON.stringify(requestBody).slice(0, 500)}...`);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:4200',
          'X-Title': 'Kozlekedesi Jegykezelo Chatbot',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`OpenRouter API error: ${response.status} - ${errorText}`);

        // Parse error to provide better user messages
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            // Check for specific error types
            if (errorData.error.message.includes('data policy')) {
              throw new Error('Az AI szolgáltatás konfigurációs problémába ütközött. Kérjük, értesítse a rendszergazdát.');
            } else if (errorData.error.message.includes('rate limit')) {
              throw new Error('Az AI szolgáltatás túlterhelt. Kérjük, próbálja újra néhány másodperc múlva.');
            } else if (errorData.error.message.includes('insufficient credits')) {
              throw new Error('Az AI szolgáltatás ideiglenesen nem elérhető. Kérjük, próbálja később.');
            }
            // Return the API error message as-is for other cases
            throw new Error(errorData.error.message);
          }
        } catch (parseError) {
          // If JSON parsing fails, use generic error
          if (parseError.message.startsWith('Az AI szolgáltatás')) {
            throw parseError; // Re-throw our custom errors
          }
        }

        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data: OpenRouterResponse = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from AI model');
      }

      // Clean the response to remove thinking/reasoning tags
      const cleanedResponse = this.cleanResponse(data.choices[0].message.content);
      return cleanedResponse;
    } catch (error) {
      this.logger.error(`OpenRouter API call failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean the AI response by removing thinking/reasoning tags
   * Some models include <think>, <reasoning>, etc. tags that should be hidden from users
   */
  private cleanResponse(response: string): string {
    let cleaned = response;

    // Remove <think>...</think> tags (used by DeepSeek and similar models)
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');

    // Remove <reasoning>...</reasoning> tags
    cleaned = cleaned.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');

    // Remove <thought>...</thought> tags
    cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, '');

    // Remove any other common thinking patterns
    cleaned = cleaned.replace(/\[thinking\][\s\S]*?\[\/thinking\]/gi, '');
    cleaned = cleaned.replace(/\*\*Thinking:\*\*[\s\S]*?\*\*Response:\*\*/gi, '');

    // Trim whitespace and remove leading/trailing newlines
    cleaned = cleaned.trim();

    // If the response is empty after cleaning, return a fallback message
    if (!cleaned) {
      return 'Sajnálom, nem sikerült megfelelő választ generálnom. Kérlek, próbáld újrafogalmazni a kérdésed.';
    }

    return cleaned;
  }

  /**
   * Refresh the routes and stops cache if needed
   */
  private async refreshDataCache(): Promise<void> {
    const now = Date.now();
    if (now - this.cacheTimestamp < this.CACHE_TTL && this.routesCache.length > 0) {
      return; // Cache is still valid
    }

    try {
      const supabase = this.supabaseService.getClient();

      // Fetch routes
      const { data: routes, error: routesError } = await supabase
        .from('routes')
        .select('id, route_number, name, route_type')
        .eq('is_active', true)
        .order('route_number');

      if (routesError) {
        this.logger.error(`Failed to fetch routes: ${routesError.message}`);
      } else {
        this.routesCache = routes || [];
      }

      // Fetch stops
      const { data: stops, error: stopsError } = await supabase
        .from('stops')
        .select('id, name, type')
        .order('name');

      if (stopsError) {
        this.logger.error(`Failed to fetch stops: ${stopsError.message}`);
      } else {
        this.stopsCache = stops || [];
      }

      this.cacheTimestamp = now;
      this.logger.log(`Cache refreshed: ${this.routesCache.length} routes, ${this.stopsCache.length} stops`);
    } catch (error) {
      this.logger.error(`Failed to refresh cache: ${error.message}`);
    }
  }

  /**
   * Process messages to handle models that don't support system role
   * Converts system messages to user messages with context prefix
   */
  private processMessagesForModel(messages: Array<{ role: string; content: string }>): Array<{ role: string; content: string }> {
    const processedMessages: Array<{ role: string; content: string }> = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        // Convert system message to user message with context marker
        processedMessages.push({
          role: 'user',
          content: `[RENDSZER KONTEXTUS - ne válaszolj erre, csak használd referenciaként]\n\n${msg.content}`,
        });
        // Add an acknowledgment from assistant
        processedMessages.push({
          role: 'assistant',
          content: 'Szia! Miben segíthetek?',
        });
      } else {
        processedMessages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    return processedMessages;
  }
}
