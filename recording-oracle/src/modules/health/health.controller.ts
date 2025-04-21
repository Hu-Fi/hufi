import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { DataSource } from 'typeorm';

import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(StorageService) private readonly storage: StorageService,
    @Inject(Web3Service) private readonly web3: Web3Service,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deep health‑check of core dependencies' })
  @ApiResponse({ status: 200, description: 'All systems operational' })
  @ApiResponse({
    status: 503,
    description: 'One or more dependencies are down',
  })
  async getHealth(@Res() res: Response) {
    const checks = {
      db: false,
      storage: false,
      web3: false,
    };
    try {
      await this.dataSource.query('SELECT 1');
      checks.db = true;
    } catch /* istanbul ignore next */ {}

    try {
      await this.storage.minioClient.listBuckets(); // lightweight HEAD call
      checks.storage = true;
    } catch /* istanbul ignore next */ {}

    try {
      const firstChain = this.web3.getValidChains()[0];
      const signer = this.web3.getSigner(firstChain);
      await signer.provider?.getBlockNumber();
      checks.web3 = true;
    } catch /* istanbul ignore next */ {}

    const healthy = Object.values(checks).every(Boolean);

    const payload = {
      status: healthy ? 'ok' : 'error',
      uptime: process.uptime(), // seconds
      timestamp: new Date().toISOString(),
      checks,
    };

    return res
      .status(healthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
      .json(payload);
  }
}
