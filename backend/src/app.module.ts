import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from "./users/users.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import {JwtStrategy}  from "./common/guards/jwt.strategy";
import { CityProfileModule } from './cities/cityProfile.module';
import { ProjectsModule } from './projects/projects.module';
import { DocumentsModule } from './documents/documents.module';
import { CommunicationModule } from './communication/communication.module';
import {EventsModule } from './events/events.module';
import { NewsModule } from './news/news.module';
import { BudgetModule } from './budget/budget.module';
import { SearchModule } from './search/search.module';
import { NotificationModule } from './notifications/notification.module';
import { ReportsModule } from './reports/reports.module';
import { EmailModule } from './email/email.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
    UsersModule,
    ProjectsModule,
    CityProfileModule,
    DocumentsModule,
    CommunicationModule,
    EventsModule,
    NewsModule,
    BudgetModule,
    SearchModule,
    NotificationModule,
    ReportsModule,
    EmailModule
  ],
  controllers: [AppController],
  providers: [AppService , JwtStrategy,{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}