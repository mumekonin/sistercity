import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentApprovalStatus, AccessLevel, Role, City } from '../../common/enum/enum';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { DocumentFile } from '../schema/documents.shema';
import { CreateDocumentDto } from '../dto/documents.dto';
import { DocumentResponse } from '../response/documents.response';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(DocumentFile.name)
    private readonly documentModel: Model<DocumentFile>,
    private readonly cloudinaryService: CloudinaryService,
  ) { }
  async uploadDocument(createDocumentDto: CreateDocumentDto, file: Express.Multer.File, currentUser: any): Promise<DocumentResponse> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const uploadedFile = await this.cloudinaryService.uploadFile(file, 'sister-city/documents');
    if (createDocumentDto.expiryDate) {
      if (createDocumentDto.expiryDate <= new Date()) {
        throw new BadRequestException('Expiry date must be in the future');
      }
    }
    if (createDocumentDto.documentDate > new Date()) {
      throw new BadRequestException('Document date cannot be in the future');
    }
    const newDocument = new this.documentModel({
      title: createDocumentDto.title,
      category: createDocumentDto.category,
      relatedProject: createDocumentDto.relatedProject || null,
      documentDate: createDocumentDto.documentDate,
      description: createDocumentDto.description,
      accessLevel: createDocumentDto.accessLevel,
      expiryDate: createDocumentDto.expiryDate || null,
      // From JWT
      uploadedBy: currentUser.userId,
      city: currentUser.city,
      department: currentUser.department,
      // From Cloudinary upload
      fileUrl: uploadedFile.fileUrl,
      fileName: uploadedFile.fileName,
      fileType: uploadedFile.fileType,
      fileSize: uploadedFile.fileSize,
      // Auto set
      versionNumber: 1,
      previousVersions: [],
      approvalStatus: DocumentApprovalStatus.DRAFT,
      approvedBy: null,
      approvalNote: null,
      isArchived: false,
      activityLog: [{
        userId: currentUser.userId,
        action: 'UPLOADED',
        timestamp: new Date(),
      }],
    });
    const savedDocument = await newDocument.save();
    return this.mapToResponse(savedDocument);
  }
  private mapToResponse(doc: any): DocumentResponse {
    return {
      id: doc._id.toString(),
      title: doc.title,
      category: doc.category,
      uploadedBy: doc.uploadedBy.toString(),
      city: doc.city,
      department: doc.department,
      relatedProject: doc.relatedProject ? doc.relatedProject.toString() : null,
      documentDate: doc.documentDate,
      description: doc.description,
      accessLevel: doc.accessLevel,
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      versionNumber: doc.versionNumber,
      previousVersions: doc.previousVersions.map((v: any) => ({
        fileUrl: v.fileUrl,
        fileName: v.fileName,
        versionNumber: v.versionNumber,
        uploadedAt: v.uploadedAt,
        changeNote: v.changeNote,
      })),
      approvalStatus: doc.approvalStatus,
      approvedBy: doc.approvedBy ? doc.approvedBy.toString() : null,
      approvalNote: doc.approvalNote,
      expiryDate: doc.expiryDate,
      isArchived: doc.isArchived,
      activityLog: doc.activityLog.map((a: any) => ({
        userId: a.userId.toString(),
        action: a.action,
        timestamp: a.timestamp,
      })),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}