import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PracticeService } from './practice.service';
import { StartPracticeDto, SubmitAnswerDto, CompletePracticeDto } from './practice.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Practice')
@Controller('practice')
export class PracticeController {
  constructor(private readonly service: PracticeService) {}

  @Post('start')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a new live tutor practice session' })
  async startPractice(@Request() req: any, @Body() dto: StartPracticeDto) {
    const userId = req.user.userId || req.user.id;
    return this.service.startSession(userId, dto.sublevelId);
  }

  @Get('session/:id/next')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the next question in the active session' })
  async getNextQuestion(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.userId || req.user.id;
    return this.service.getNextQuestion(id, userId);
  }

  @Post('session/:id/submit')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit an answer to the current active question' })
  async submitAnswer(@Request() req: any, @Param('id') id: string, @Body() dto: SubmitAnswerDto) {
    const userId = req.user.userId || req.user.id;
    return this.service.submitAnswer(id, userId, dto.answer);
  }

  @Post('session/:id/complete')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark the practice session as completed' })
  async completePractice(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CompletePracticeDto,
  ) {
    const userId = req.user.userId || req.user.id;
    return this.service.completeSession(id, userId, dto.correctAnswersCount, dto.totalQuestions);
  }
}
