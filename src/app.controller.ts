import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { PromptDto } from './dto/prompt.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return 'thefolder-api is running';
  }

  @Post('completions')
  async completions(@Body() promptDto: PromptDto) {
    return this.appService.completions(promptDto);
  }
}
