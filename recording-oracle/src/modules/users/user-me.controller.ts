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
import type { UserPreferencesEntity } from './user-preferences.entity';
import { UserPreferencesService } from './user-preferences.service';
import { UserNotFoundError } from './users.errors';
import { UsersRepository } from './users.repository';

function pickPreferencesDto(
  preferences: UserPreferencesEntity,
): PreferencesDto {
  return {
    campaignsAutojoin: preferences.campaignsAutojoin,
  };
}

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
      preferences: user.preferences
        ? pickPreferencesDto(user.preferences)
        : DEFAULT_USER_PREFERENCES,
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
  async savePreferences(
    @Req() request: RequestWithUser,
    @Body() data: UpdatePreferencesDto,
  ): Promise<PreferencesDto> {
    const userId = request.user.id;

    const updatedPreferences =
      await this.userPreferencesService.savePreferences(userId, data);

    return pickPreferencesDto(updatedPreferences);
  }
}
