import { Body, Controller, Get, Patch, Req, UseFilters } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import type { RequestWithUser } from '@/common/types';

import { DEFAULT_USER_PREFERENCES } from './constants';
import { PreferencesDto, UpdatePreferencesDto, UserMeDto } from './user-me.dto';
import { UserMeControllerErrorsFilter } from './user-me.error-filter';
import { UserPreferencesService } from './user-preferences.service';
import { UserNotFoundError } from './users.errors';
import { UsersRepository } from './users.repository';

@ApiTags('Current User')
@ApiBearerAuth()
@UseFilters(UserMeControllerErrorsFilter)
@Controller('/me')
export class UserMeController {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly userPreferencesService: UserPreferencesService,
  ) {}

  @ApiOperation({
    summary: 'Get information about the authenticated user',
  })
  @ApiResponse({
    status: 200,
    type: UserMeDto,
  })
  @Get('/')
  async getCurrentUser(@Req() request: RequestWithUser): Promise<UserMeDto> {
    const userId = request.user.id;

    const user = await this.usersRepository.findOneById(userId, {
      relations: { preferences: true },
    });

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return {
      id: userId,
      evmAddress: user.evmAddress,
      preferences: {
        campaignsAutojoin: Object.assign(
          {},
          DEFAULT_USER_PREFERENCES.campaignsAutojoin,
          user.preferences?.campaignsAutojoin,
        ),
        telegramUserId: user.preferences?.telegramUserId || null,
        notifications: Object.assign(
          {},
          DEFAULT_USER_PREFERENCES.notifications,
          user.preferences?.notifications,
        ),
      },
    };
  }

  @ApiOperation({
    summary: 'Save user preferences',
  })
  @ApiBody({ type: UpdatePreferencesDto })
  @ApiResponse({
    status: 200,
    type: PreferencesDto,
  })
  @Patch('/preferences')
  async updatePreferences(
    @Req() request: RequestWithUser,
    @Body() data: UpdatePreferencesDto,
  ): Promise<PreferencesDto> {
    const userId = request.user.id;

    const updatedPreferences = await this.userPreferencesService.update(
      userId,
      data,
    );

    return {
      telegramUserId: updatedPreferences.telegramUserId,
      campaignsAutojoin: updatedPreferences.campaignsAutojoin,
      notifications: updatedPreferences.notifications,
    };
  }
}
