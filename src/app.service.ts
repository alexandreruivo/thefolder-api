import { Injectable, HttpException, HttpStatus, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { PromptDto } from './dto/prompt.dto';
import { Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private apiKey: string;
  private model: string;
  private apiBase: string;
  private callCount: number = 0;
  private supabase;
  private readonly logger = new Logger(AppService.name);


  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!apiKey) {
      throw new HttpException('OpenAI API key is not set in environment variables', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    if (!supabaseUrl || !supabaseKey) {
      throw new HttpException('Supabase credentials are not set in environment variables', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    this.apiKey = apiKey;
    this.model = this.configService.get<string>('OPENAI_API_MODEL', 'gpt-3.5-turbo');
    this.apiBase = this.configService.get<string>('OPENAI_API_BASE', 'https://api.openai.com/v1');
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  private async updateUserCallCount(email: string, callCount: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_calls')
        .upsert(
          {
            email,
            call_count: callCount,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'email',
            count: 'call_count'
          }
        );

      if (error) {
        console.error('Error updating call count:', error);
        throw new Error('Failed to update call count');
      }
    } catch (error) {
      console.error('Error in updateUserCallCount:', error);
      throw new HttpException('Failed to update call count', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async completions(promptDto: PromptDto): Promise<{ content: string }> {
    const { prompt, user } = promptDto;
    if (!prompt || !user) {
      throw new BadRequestException('Prompt and user are required');
    }
    const response = await fetch(`${this.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'user', content: prompt },
        ],
        max_tokens: 1200,
        temperature: 0.1,
      }),
    }).catch(error => {
      console.error('❌ Fetch error:', error);
      throw new InternalServerErrorException('Failed to connect to OpenAI API');
    });

    if (!response.ok) {
      const error = await response.text();
      throw new InternalServerErrorException(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    this.callCount++;
    await this.updateUserCallCount(user, this.callCount);

    return {
      content
    };
  }
}
