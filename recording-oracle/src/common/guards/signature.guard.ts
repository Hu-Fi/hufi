import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { HEADER_SIGNATURE_KEY } from '../constants';
import { ControlledError } from '../errors/controlled';
import { verifySignature } from '../utils/signature';

@Injectable()
export class SignatureAuthGuard implements CanActivate {
  constructor() {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const data = request.body;
    const signature = request.headers[HEADER_SIGNATURE_KEY];

    if (!signature) {
      throw new ControlledError('Signature is missing', HttpStatus.BAD_REQUEST);
    }

    if (!data.walletAddress) {
      throw new ControlledError(
        'Wallet address is missing',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isVerified = verifySignature(data, signature, [data.walletAddress]);

    if (isVerified) {
      return true;
    }

    throw new ControlledError('Unauthorized', HttpStatus.UNAUTHORIZED);
  }
}
