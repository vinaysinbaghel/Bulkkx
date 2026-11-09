import { Module } from '@nestjs/common';
import { RequirementsController } from './requirements.controller';
import { ListingsModule } from '../listings/listings.module';
import { ListingsController } from '../listings/listings.controller';

@Module({
  imports: [ListingsModule],
  controllers: [RequirementsController],
  providers: [ListingsController],
})
export class RequirementsModule {}
