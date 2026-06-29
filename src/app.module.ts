import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from "./users/users.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import {JwtStrategy}  from "./common/guards/jwt.strategy";
import { CityProfileModule } from './cities/cityProfile.module';
import { ProjectsModule } from './projects/projects.module';
import { DocumentsModule } from './Documents/documents.module';
import { CommunicationModule } from './communication/communication.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    CommunicationModule
  ],
  controllers: [AppController],
  providers: [AppService , JwtStrategy],
})
export class AppModule {}