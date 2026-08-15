import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { SessionsService } from './sessions.service';

@Module({
  providers: [RealtimeGateway, SessionsService],
  exports: [RealtimeGateway, SessionsService],
})
export class RealtimeModule {}
