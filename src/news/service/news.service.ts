import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { News } from "../schema/news.schema ";
import { Model } from "mongoose";
import { CloudinaryService } from "src/common/cloudinary/cloudinary.service";
import { CreateNewsDto } from "../dto/news.dto";
import { NewsResponse } from "../response/new.response";
import { NewsApprovalStatus, NewsPostedByCity } from "src/common/enum/enum";

@Injectable()
export class NewsService {
  constructor(
    @InjectModel(News.name)
    private readonly newsModel: Model<News>,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async createNews(createNewsDto: CreateNewsDto, files: Express.Multer.File[], currentUser: any): Promise<NewsResponse> {
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      const uploadPromises = files.map((file) =>
        this.cloudinaryService.uploadFile(file, 'news'),
      );
      const uploadedImages = await Promise.all(uploadPromises);
      imageUrls = uploadedImages.map((img) => img.fileUrl);
    }
    const approvalStatus = createNewsDto.isJoint ? NewsApprovalStatus.PENDING_APPROVAL : NewsApprovalStatus.DRAFT;
    const postedByCity = createNewsDto.isJoint ? NewsPostedByCity.JOINT : currentUser.city;
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
}