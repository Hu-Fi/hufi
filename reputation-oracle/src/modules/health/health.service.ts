import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
    constructor() {}
    async getHealth() {
        return 'Server is running normally.';
      }
}
