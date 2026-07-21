import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CityProfileSchema, CityProfile } from './schema/cityProfile.schema';
import { CityProfileController } from './controller/cityProfile.controller';
import { CityProfileService } from './service/cityProfile.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CityProfile.name, schema: CityProfileSchema },
    ]),
  ],
  controllers: [CityProfileController],
  providers: [CityProfileService],
})
export class CityProfileModule {}
