import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { News } from '../schema/news.schema';
import { Model } from 'mongoose';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { CreateNewsDto, UpdateNewsDto } from '../dto/news.dto';
import { NewsListResponse, NewsResponse } from '../response/new.response';
import {
  City,
  NewsApprovalStatus,
  NewsPostedByCity,
  Role,
} from 'src/common/enum/enum';

@Injectable()
export class NewsService {
  constructor(
    @InjectModel(News.name)
    private readonly newsModel: Model<News>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createNews(
    createNewsDto: CreateNewsDto,
    files: Express.Multer.File[],
    currentUser: any,
  ): Promise<NewsResponse> {
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      const uploadPromises = files.map((file) =>
        this.cloudinaryService.uploadFile(file, 'news'),
      );
      const uploadedImages = await Promise.all(uploadPromises);
      imageUrls = uploadedImages.map((img) => img.fileUrl);
    }
    const approvalStatus = createNewsDto.isJoint
      ? NewsApprovalStatus.PENDING_APPROVAL
      : NewsApprovalStatus.DRAFT;
    const postedByCity = createNewsDto.isJoint
      ? NewsPostedByCity.JOINT
      : currentUser.city;
    const news = new this.newsModel({
      title: createNewsDto.title,
      category: createNewsDto.category,
      body: createNewsDto.body,
      images: imageUrls,
      postedBy: currentUser.userId,
      postedByCity,
      isPublic: createNewsDto.isPublic,
      isJoint: createNewsDto.isJoint,
      relatedProject: createNewsDto.relatedProject ?? null,
      approvalStatus,
      approvedByAdama: false,
      approvedBySheger: false,
      publishedAt: null,
      views: 0,
    });
    const saved = await news.save();
    return this.toNewsResponse(saved);
  }
  private toNewsResponse(news: any): NewsResponse {
    return {
      id: news._id.toString(),
      title: news.title,
      category: news.category,
      body: news.body,
      images: news.images,
      postedBy: news.postedBy?.toString(),
      postedByCity: news.postedByCity,
      isPublic: news.isPublic,
      isJoint: news.isJoint,
      relatedProject: news.relatedProject?.toString() ?? null,
      approvalStatus: news.approvalStatus,
      approvedByAdama: news.approvedByAdama,
      approvedByAurora: news.approvedByAurora,
      publishedAt: news.publishedAt,
      views: news.views,
      createdAt: news.createdAt,
      updatedAt: news.updatedAt,
    };
  }
  async updateNews(
    id: string,
    updateNewsDto: UpdateNewsDto,
    files: Express.Multer.File[],
    currentUser: any,
  ): Promise<NewsResponse> {
    const news = await this.newsModel.findById(id);
    if (!news) throw new NotFoundException('News not found');
    if (
      currentUser.role === Role.CITY_ADMIN &&
      news.postedByCity !== currentUser.city &&
      news.postedByCity !== NewsPostedByCity.JOINT
    ) {
      throw new ForbiddenException(
        'You can only manage news posted by your city',
      );
    }
    switch (updateNewsDto.action) {
      case 'edit':
        // can only edit DRAFT or REJECTED articles
        if (
          (news.approvalStatus as any) === NewsApprovalStatus.APPROVED ||
          news.publishedAt !== null
        ) {
          throw new BadRequestException(
            'Cannot edit an approved or published article',
          );
        }

        // new images sent  delete old + upload new
        if (files && files.length > 0) {
          if (news.images && news.images.length > 0) {
            await Promise.all(
              news.images.map((url: string) =>
                this.cloudinaryService.deleteFile(url),
              ),
            );
          }
          const uploadPromises = files.map((file) =>
            this.cloudinaryService.uploadFile(file, 'news'),
          );
          const uploaded = await Promise.all(uploadPromises);
          news.images = uploaded.map((img) => img.fileUrl);
        }
        // no images sent → keep old images
        if (updateNewsDto.title) news.title = updateNewsDto.title;
        if (updateNewsDto.category) news.category = updateNewsDto.category;
        if (updateNewsDto.body) news.body = updateNewsDto.body;
        if (updateNewsDto.isPublic !== undefined)
          news.isPublic = updateNewsDto.isPublic;
        // reset approval when edited
        news.approvalStatus = NewsApprovalStatus.DRAFT;
        news.approvedByAdama = false;
        news.approvedByAurora = false;
        break;
      case 'approve':
        if (
          (news.approvalStatus as any) !== NewsApprovalStatus.DRAFT &&
          (news.approvalStatus as any) !== NewsApprovalStatus.PENDING_APPROVAL
        ) {
          throw new BadRequestException(
            `Cannot approve news with status ${news.approvalStatus}`,
          );
        }
        if (news.isJoint) {
          if (currentUser.city === City.ADAMA) {
            if (news.approvedByAdama) {
              throw new BadRequestException(
                'Adama has already approved this article',
              );
            }
            news.approvedByAdama = true;
          }
          if (currentUser.city === City.AURORA) {
            if (news.approvedByAurora) {
              throw new BadRequestException(
                'Aurora has already approved this article',
              );
            }
            news.approvedByAurora = true;
          }
          // both approved
          if (news.approvedByAdama && news.approvedByAurora) {
            news.approvalStatus = NewsApprovalStatus.APPROVED;
          }
        } else {
          // single city  direct approve
          news.approvalStatus = NewsApprovalStatus.APPROVED;
        }
        break;
      case 'reject':
        if (!updateNewsDto.rejectionReason) {
          throw new BadRequestException('Rejection reason is required');
        }
        if ((news.approvalStatus as any) === NewsApprovalStatus.APPROVED) {
          throw new BadRequestException(
            'Cannot reject an already approved article',
          );
        }
        news.approvalStatus = NewsApprovalStatus.REJECTED;
        break;
      case 'publish':
        if ((news.approvalStatus as any) !== NewsApprovalStatus.APPROVED) {
          throw new BadRequestException(
            'Article must be APPROVED before publishing',
          );
        }
        if (news.isJoint) {
          if (!news.approvedByAdama || !news.approvedByAurora) {
            throw new BadRequestException(
              'Both cities must approve before publishing a joint article',
            );
          }
        }
        news.publishedAt = new Date();
        break;
      case 'unpublish':
        if (!news.publishedAt) {
          throw new BadRequestException('Article is not published yet');
        }
        news.publishedAt = null;
        break;

      default:
        throw new BadRequestException('Invalid action');
    }
    const updated = await news.save();
    return this.toNewsResponse(updated);
  }
  async getAllNews(
    category?: string,
    city?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const filter: any = { publishedAt: { $ne: null }, isPublic: true };

    if (category) filter.category = category;
    if (city) filter.postedByCity = city;

    const skip = (page - 1) * limit;
    const news = await this.newsModel
      .find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const total = await this.newsModel.countDocuments(filter);

    return {
      data: news.map((n) => this.toNewsListResponse(n)),
      total,
      page,
      limit,
    };
  }
  private toNewsListResponse(news: any): NewsListResponse {
    return {
      id: news._id.toString(),
      title: news.title,
      category: news.category,
      postedByCity: news.postedByCity,
      isPublic: news.isPublic,
      isJoint: news.isJoint,
      approvalStatus: news.approvalStatus,
      publishedAt: news.publishedAt,
    };
  }

  async getManageNews(
    category?: string,
    city?: string,
    page: number = 1,
    limit: number = 10,
    currentUser?: any,
  ) {
    const filter: any = {};
    if (category) filter.category = category;
    if (city) filter.postedByCity = city;

    if (currentUser?.role === Role.CITY_ADMIN) {
      filter.$or = [{ postedByCity: currentUser.city }, { isJoint: true }];
    }

    const skip = (page - 1) * limit;
    const news = await this.newsModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const total = await this.newsModel.countDocuments(filter);

    return {
      data: news.map((n) => this.toNewsListResponse(n)),
      total,
      page,
      limit,
    };
  }
  async getNewsById(id: string): Promise<NewsResponse> {
    const news = await this.newsModel.findById(id).lean();
    if (!news) throw new NotFoundException('News not found');
    if (!news.publishedAt || !news.isPublic) {
      throw new ForbiddenException('This article is not available');
    }
    await this.newsModel.findByIdAndUpdate(id, { $inc: { views: 1 } });
    return this.toNewsResponse(news);
  }

  async getManageNewsById(id: string, currentUser: any): Promise<NewsResponse> {
    const news = await this.newsModel.findById(id).lean();
    if (!news) throw new NotFoundException('News not found');

    if (
      currentUser.role === Role.CITY_ADMIN &&
      news.postedByCity !== currentUser.city &&
      news.postedByCity !== NewsPostedByCity.JOINT
    ) {
      throw new ForbiddenException(
        "You can only view your own city's unpublished articles",
      );
    }

    return this.toNewsResponse(news);
  }
  async deleteNews(id: string, currentUser: any): Promise<{ message: string }> {
    const news = await this.newsModel.findById(id);
    if (!news) throw new NotFoundException('News not found');
    if (
      currentUser.role !== Role.SUPER_ADMIN &&
      news.postedByCity !== currentUser.city &&
      news.postedByCity !== NewsPostedByCity.JOINT
    ) {
      throw new ForbiddenException(
        'You can only delete your own city articles',
      );
    }
    // cannot delete published article
    if (news.publishedAt) {
      throw new BadRequestException('Cannot delete a published article');
    }
    // delete images from Cloudinary
    if (news.images && news.images.length > 0) {
      try {
        await Promise.all(
          news.images.map((url: string) =>
            this.cloudinaryService.deleteFile(url),
          ),
        );
      } catch (error) {
        console.warn('Failed to delete images from Cloudinary:', error);
      }
    }
    await this.newsModel.findByIdAndDelete(id);
    return { message: `Article "${news.title}" deleted successfully` };
  }
}
