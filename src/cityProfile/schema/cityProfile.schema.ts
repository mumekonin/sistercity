import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { City } from '../../common/enum/enum';

@Schema({ _id: false })
class BasicInfo {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  region!: string;

  @Prop({ required: true })
  yearEstablished!: number;

  @Prop({ required: true })
  landAreaSm2!: number;

  @Prop()
  officialWebsite?: string;
}

@Schema({ _id: false })
class Population {
  @Prop({ required: true })
  total!: number;

  @Prop({ required: true })
  male!: number;

  @Prop({ required: true })
  female!: number;

  @Prop({ required: true })
  youth!: number;

  @Prop({ required: true })
  lastUpdated!: Date;
}

@Schema({ _id: false })
class KeyOfficial {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  email!: string;

  @Prop({ required: true })
  phone!: string;
}

@Schema({ _id: false })
class Department {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  headName!: string;

  @Prop({ required: true })
  headEmail!: string;
}

@Schema({ _id: false })
class ContactInfo {
  @Prop({ required: true })
  address!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ required: true })
  email!: string;
}

@Schema({ _id: false })
class PartnershipHistory {
  @Prop({ required: true })
  agreementDate!: Date;

  @Prop({ required: true })
  summary!: string;
}
@Schema({ timestamps: true })
export class CityProfile extends Document {
  @Prop({ required: true, enum: City })
  city!: City;

  @Prop({ required: true, type: BasicInfo })
  basicInfo!: BasicInfo;

  @Prop({ required: true, type: Population })
  population!: Population;

  @Prop({ required: true, type: [KeyOfficial] })
  keyOfficials!: KeyOfficial[];

  @Prop({ required: true, type: [Department] })
  departments!: Department[];

  @Prop({ required: true, type: [String] })
  areasOfFocus!: string[];

  @Prop({ required: true, type: ContactInfo })
  contactInfo!: ContactInfo;

  @Prop({ required: true, type: PartnershipHistory })
  partnershipHistory!: PartnershipHistory;
}

export const CityProfileSchema = SchemaFactory.createForClass(CityProfile);