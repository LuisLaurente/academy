import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';

@Module({
  controllers: [AuthController],
  exports: [AuthGuard, AdminGuard],
  providers: [AuthGuard, AdminGuard],
})
export class AuthModule {}
