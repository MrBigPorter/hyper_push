import { Module } from '@nestjs/common';
import { GraphiQLController } from './graphiql.controller.js';

@Module({
  controllers: [GraphiQLController],
})
export class GraphiQLModule {}
