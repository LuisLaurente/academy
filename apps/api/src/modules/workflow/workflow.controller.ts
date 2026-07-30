// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { CryptoUuidService } from '@learning-os/server/core';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaWorkflowRepository } from '@learning-os/server/infrastructure';
import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  type CompleteWorkflowDto,
  type ExecuteStepDto,
  type StartWorkflowDto,
  WorkflowResponseDto,
} from './workflow.dto';

@ApiTags('Workflow')
@Controller('workflows')
export class WorkflowController {
  constructor(
    private readonly repository: PrismaWorkflowRepository,
    private readonly uuidService: CryptoUuidService,
  ) {
    void this.repository;
  }

  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a new learning workflow' })
  @ApiResponse({ status: 201, type: WorkflowResponseDto })
  async startWorkflow(@Body() dto: StartWorkflowDto): Promise<WorkflowResponseDto> {
    return {
      currentStep: 'initialized',
      id: this.uuidService.generate(),
      status: 'active',
      studentId: dto.studentId,
    };
  }

  @Post(':id/execute-step')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute the next step in workflow' })
  @ApiResponse({ status: 200, type: WorkflowResponseDto })
  async executeStep(
    @Param('id') id: string,
    @Body() dto: ExecuteStepDto,
  ): Promise<WorkflowResponseDto> {
    void dto;
    return {
      currentStep: 'content_retrieval',
      id,
      status: 'active',
      studentId: 'student-1',
    };
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a learning workflow' })
  @ApiResponse({ status: 200, type: WorkflowResponseDto })
  async completeWorkflow(
    @Param('id') id: string,
    @Body() dto: CompleteWorkflowDto,
  ): Promise<WorkflowResponseDto> {
    void dto;
    return {
      currentStep: 'completed',
      id,
      status: 'completed',
      studentId: 'student-1',
    };
  }
}
