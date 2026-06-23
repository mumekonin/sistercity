import { Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { CityProfile } from "../schema/cityProfile.schema";
import { CreateCityProfileDto } from "../dto/cityProfile.dto";
import { CityProfileResponse } from "../response/cityProfile.response";
import { ConflictException } from "@nestjs/common";
@Injectable()
export class CityProfileService {
  constructor(
    @InjectModel(CityProfile.name)
    private readonly cityProfileModel: Model<CityProfile>
  ) { }

  async createCityProfile(createCityProfileDto: CreateCityProfileDto): Promise<CityProfileResponse> {
    const existing = await this.cityProfileModel.findOne({ city: createCityProfileDto.city });
    if (existing) {
      throw new ConflictException(
        `Profile for ${createCityProfileDto.city} already exists`,
      );
    }

    const cityProfile = new this.cityProfileModel(createCityProfileDto);
    const saved = await cityProfile.save();

    const cityProfileResponse: CityProfileResponse = {
      id: saved._id.toString(),
      city: saved.city,
      basicInfo: {
        name: saved.basicInfo.name,
        region: saved.basicInfo.region,
        yearEstablished: saved.basicInfo.yearEstablished,
        landAreaSm2: saved.basicInfo.landAreaSm2,
        officialWebsite: saved.basicInfo.officialWebsite,
      },
      population: {
        total: saved.population.total,
        male: saved.population.male,
        female: saved.population.female,
        youth: saved.population.youth,
        lastUpdated: saved.population.lastUpdated,
      },
      keyOfficials: saved.keyOfficials.map((official: any) => ({
        name: official.name,
        title: official.title,
        email: official.email,
        phone: official.phone,
      })),
      departments: saved.departments.map((dept: any) => ({
        name: dept.name,
        headName: dept.headName,
        headEmail: dept.headEmail,
      })),
      areasOfFocus: saved.areasOfFocus,
      contactInfo: {
        address: saved.contactInfo.address,
        phone: saved.contactInfo.phone,
        email: saved.contactInfo.email,
      },
      partnershipHistory: {
        agreementDate: saved.partnershipHistory.agreementDate,
        summary: saved.partnershipHistory.summary,
      },
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };

    return cityProfileResponse;
  }
}