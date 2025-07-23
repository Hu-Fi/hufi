import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { InvalidCampaignManifestError } from './campaigns.errors';

@Catch(InvalidCampaignManifestError)
export class CampaignsControllerErrorsFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = HttpStatus.UNPROCESSABLE_ENTITY;

    let message: string = exception.message;
    if (exception instanceof InvalidCampaignManifestError) {
      message = `${exception.message}: ${exception.details}`;
    }

    return response.status(status).json({
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
