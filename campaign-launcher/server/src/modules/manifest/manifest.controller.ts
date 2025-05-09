import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiKeyGuard } from '../../common/guards/api-key.guard';

import {
  ManifestUploadRequestDto,
  ManifestUploadRequestDtoV2,
  ManifestUploadResponseDto,
} from './manifest.dto';
import { ManifestService } from './manifest.service';

@ApiTags('manifest')
@Controller('manifest')
export class ManifestController {
  constructor(private manifestService: ManifestService) {}

  @UseGuards(ApiKeyGuard)
  @Post('/upload')
  @ApiOperation({ summary: 'Upload manifest data' })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Manifest uploaded',
    type: ManifestUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async uploadManifest(@Body() data: ManifestUploadRequestDto) {
    return this.manifestService.uploadManifest(data);
  }

  @UseGuards(ApiKeyGuard)
  @Post('/v2/upload')
  @ApiOperation({ summary: 'Upload manifest data' })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Manifest uploaded',
    type: ManifestUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async uploadManifestV2(@Body() data: ManifestUploadRequestDtoV2) {
    return this.manifestService.uploadManifestV2(data);
  }
}
