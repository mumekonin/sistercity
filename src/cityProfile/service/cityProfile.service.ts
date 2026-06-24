import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { CityProfile } from "../schema/cityProfile.schema";
import { CreateCityProfileDto, UpdateCityProfileDto } from "../dto/cityProfile.dto";
import { CityProfileResponse } from "../response/cityProfile.response";
import { ConflictException } from "@nestjs/common";
import { Role } from "src/common/enum/enum";
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

  async updateCityProfile(id: string, updateDto: UpdateCityProfileDto, currentUser: any,): Promise<CityProfileResponse> {
    const profile = await this.cityProfileModel.findById(id);
    if (!profile) throw new NotFoundException(`Profile  not found`);

    if (currentUser.role === Role.CITY_ADMIN && currentUser.city !==  profile.city) {
      throw new ForbiddenException('You can only update your own city profile');
    }

    // basicInfo 
    if (updateDto.basicInfo?.name) {
      profile.basicInfo.name = updateDto.basicInfo.name;
    }
    if (updateDto.basicInfo?.region) {
      profile.basicInfo.region = updateDto.basicInfo.region;
    }
    if (updateDto.basicInfo?.yearEstablished) {
      profile.basicInfo.yearEstablished = updateDto.basicInfo.yearEstablished;
    }
    if (updateDto.basicInfo?.landAreaSm2) {
      profile.basicInfo.landAreaSm2 = updateDto.basicInfo.landAreaSm2;
    }
    if (updateDto.basicInfo?.officialWebsite) {
      profile.basicInfo.officialWebsite = updateDto.basicInfo.officialWebsite;
    }
    // population fields
    if (updateDto.population?.total) {
      profile.population.total = updateDto.population.total;
    }
    if (updateDto.population?.male) {
      profile.population.male = updateDto.population.male;
    }
    if (updateDto.population?.female) {
      profile.population.female = updateDto.population.female;
    }
    if (updateDto.population?.youth) {
      profile.population.youth = updateDto.population.youth;
    }
    if (updateDto.population?.lastUpdated) {
      profile.population.lastUpdated = updateDto.population.lastUpdated;
    }
    // replace full arrays when sent
    if (updateDto.keyOfficials) {
      profile.keyOfficials = updateDto.keyOfficials;
    }
    if (updateDto.departments) {
      profile.departments = updateDto.departments;
    }
    if (updateDto.areasOfFocus) {
      profile.areasOfFocus = updateDto.areasOfFocus;
    }
    // contactInfo fields
    if (updateDto.contactInfo?.address) {
      profile.contactInfo.address = updateDto.contactInfo.address;
    }
    if (updateDto.contactInfo?.phone) {
      profile.contactInfo.phone = updateDto.contactInfo.phone;
    }
    if (updateDto.contactInfo?.email) {
      profile.contactInfo.email = updateDto.contactInfo.email;
    }
    // partnershipHistory fields
    if (updateDto.partnershipHistory?.agreementDate) {
      profile.partnershipHistory.agreementDate = updateDto.partnershipHistory.agreementDate;
    
    }if (updateDto.partnershipHistory?.summary) {
      profile.partnershipHistory.summary = updateDto.partnershipHistory.summary;
    }
    const updated = await profile.save();

    const cityProfileResponse: CityProfileResponse = {
      id: updated._id.toString(),
      city: updated.city,
      basicInfo: {
        name: updated.basicInfo.name,
        region: updated.basicInfo.region,
        yearEstablished: updated.basicInfo.yearEstablished,
        landAreaSm2: updated.basicInfo.landAreaSm2,
        officialWebsite: updated.basicInfo.officialWebsite,
      },
      population: {
        total: updated.population.total,
        male: updated.population.male,
        female: updated.population.female,
        youth: updated.population.youth,
        lastUpdated: updated.population.lastUpdated,
      },
      keyOfficials: updated.keyOfficials.map((official: any) => ({
        name: official.name,
        title: official.title,
        email: official.email,
        phone: official.phone,
      })),
      departments: updated.departments.map((dept: any) => ({
        name: dept.name,
        headName: dept.headName,
        headEmail: dept.headEmail,
      })),
      areasOfFocus: updated.areasOfFocus,
      contactInfo: {
        address: updated.contactInfo.address,
        phone: updated.contactInfo.phone,
        email: updated.contactInfo.email,
      },
      partnershipHistory: {
        agreementDate: updated.partnershipHistory.agreementDate,
        summary: updated.partnershipHistory.summary,
      },
      updatedAt: updated.updatedAt,
      createdAt: updated.createdAt,
    };

    return cityProfileResponse;
  }
 async getAllCityProfiles(): Promise<CityProfileResponse[]> {
  const profiles = await this.cityProfileModel.find().lean();

  if (!profiles || profiles.length === 0) {
    throw new NotFoundException('No city profiles found');
  }

  const cityProfilesResponse: CityProfileResponse[] = profiles.map((profile) => {
    return {
      id: profile._id.toString(),
      city: profile.city,
      basicInfo: {
        name: profile.basicInfo.name,
        region: profile.basicInfo.region,
        yearEstablished: profile.basicInfo.yearEstablished,
        landAreaSm2: profile.basicInfo.landAreaSm2,
        officialWebsite: profile.basicInfo.officialWebsite
      },
      population: {
        total: profile.population.total,
        male: profile.population.male,
        female: profile.population.female,
        youth: profile.population.youth,
        lastUpdated: profile.population.lastUpdated,
      },
      keyOfficials: profile.keyOfficials.map((official: any) => ({
        name: official.name,
        title: official.title,
        email: official.email,
        phone: official.phone,
      })),
      departments: profile.departments.map((dept: any) => ({
        name: dept.name,
        headName: dept.headName,
        headEmail: dept.headEmail,
      })),
      areasOfFocus: profile.areasOfFocus,
      contactInfo: {
        address: profile.contactInfo.address,
        phone: profile.contactInfo.phone,
        email: profile.contactInfo.email,
      },
      partnershipHistory: {
        agreementDate: profile.partnershipHistory.agreementDate,
        summary: profile.partnershipHistory.summary,
      },
      updatedAt: profile.updatedAt,
      createdAt: profile.createdAt,
    };
  });
  return cityProfilesResponse;
}
}