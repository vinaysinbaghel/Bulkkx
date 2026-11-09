import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { CategoriesModule } from './categories/categories.module';
import { ListingsModule } from './listings/listings.module';
import { RequirementsModule } from './requirements/requirements.module';
import { DealsModule } from './deals/deals.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    DbModule,
    AuthModule,
    AuditModule,
    CategoriesModule,
    ListingsModule,
    RequirementsModule,
    DealsModule,
    WebhooksModule,
  ],
})
export class AppModule {}
