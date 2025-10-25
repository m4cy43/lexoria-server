import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { BaseQueryDto } from 'src/common/dto/query.dto';

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('logs')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async bookList(
    @Query() query: BaseQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.userService.findUserLogs(user.sub, query.limit);
  }
}
