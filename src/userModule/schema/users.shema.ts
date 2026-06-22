import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Role, City } from "../../common/enum/enum";
@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true, enum: Role })
  role!: Role;

  @Prop({ required: true, enum: City })
  city!: City;

  @Prop()
  department?: string;

  @Prop({ required: true })
  jobTitle!: string;

  @Prop()
  phone?: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: 0 })
  failedLoginAttempts!: number;

  @Prop({ default: false })
  isLocked!: boolean;

  @Prop()
  lastLogin?: Date;
}

export const userSchema = SchemaFactory.createForClass(User);