import { EscrowUtils } from '@human-protocol/sdk';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { HEADER_SIGNATURE_KEY } from '../constants';
import { Role } from '../enums/role';
import { verifySignature } from '../utils/signature';

@Injectable()
export class SignatureAuthGuard implements CanActivate {
  constructor(private role: Role[]) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const data = request.body;
    const signature = request.headers[HEADER_SIGNATURE_KEY];
    const oracleAddresses: string[] = [];
    try {
      const escrowData = await EscrowUtils.getEscrow(
        data.chainId,
        data.escrowAddress,
      );
      if (this.role.includes(Role.JobLaucher))
        oracleAddresses.push(escrowData.launcher);
      if (this.role.includes(Role.Exchange))
        oracleAddresses.push(escrowData.exchangeOracle!);
      if (this.role.includes(Role.Recording))
        oracleAddresses.push(escrowData.recordingOracle!);

      const isVerified = verifySignature(data, signature, oracleAddresses);

      if (isVerified) {
        return true;
      }
    } catch (error) {
      console.error(error);
    }

    throw new UnauthorizedException('Unauthorized');
  }
}
