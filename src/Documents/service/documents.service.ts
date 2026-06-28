import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentApprovalStatus, AccessLevel, Role, City } from '../../common/enum/enum';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { DocumentFile } from '../schema/documents.shema';
import { CreateDocumentDto } from '../dto/documents.dto';
import { DocumentListResponse, DocumentResponse } from '../response/documents.response';

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
  async getAllDocuments(currentUser: any): Promise<DocumentListResponse[]> {
    let documents: any[] = [];
    //super admin sees all document
    if (currentUser.role === Role.SUPER_ADMIN) {
      documents = await this.documentModel.find({ isArchived: false }).lean();
    }
    //city admin only sees thir own city document
    if (currentUser.role === Role.CITY_ADMIN) {
      documents = await this.documentModel
        .find({
          isArchived: false,
          $or: [
            { city: currentUser.city, },
            {
              city: { $ne: currentUser.city },
              accessLevel: {
                $in: [
                  AccessLevel.PUBLIC,
                  AccessLevel.BOTH_CITIES]
              }
            }]
        })
        .lean();
    }
    //Dept Officer  sees documents based on access level   
    if (currentUser.role === Role.DEPT_OFFICER) {
      documents = await this.documentModel
        .find({
          isArchived: false,
          $or: [
            // Own department documents
            {
              city: currentUser.city,
              department: currentUser.department,
            },
            // Public and both cities documents
            {
              accessLevel: {
                $in: [
                  AccessLevel.PUBLIC,
                  AccessLevel.BOTH_CITIES]
              }
            },
          ]
        })
        .lean();
    }
    if (!documents || documents.length === 0) return [];
    return documents.map((doc: any) =>
      this.mapToListResponse(doc)
    );
  }
  private mapToListResponse(doc: any): DocumentListResponse {
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
      approvalStatus: doc.approvalStatus,
      expiryDate: doc.expiryDate,
      isArchived: doc.isArchived,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
  async getDocumentById(documentId: string, currentUser: any): Promise<DocumentResponse> {
    const doc = await this.documentModel.findById(documentId).lean();
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    if (doc.isArchived) {
      throw new NotFoundException('Document not found');
    }
    if (currentUser.role === Role.SUPER_ADMIN) {
    } else if (currentUser.role === Role.CITY_ADMIN) {
      if (doc.city === currentUser.city) {
        // allowed
      } else {
        if (doc.accessLevel === AccessLevel.DEPARTMENT_ONLY || doc.accessLevel === AccessLevel.ADMINS_ONLY) {
          throw new ForbiddenException('You do not have permission to view this document');
        }
      }
    } else if (currentUser.role === Role.DEPT_OFFICER) {
      if (doc.city === currentUser.city && doc.department === currentUser.department
      ) {
        // allowed
      }
      else if (doc.accessLevel === AccessLevel.PUBLIC || doc.accessLevel === AccessLevel.BOTH_CITIES
      ) {
        // allowed
      }
      else {
        throw new ForbiddenException('You do not have permission to view this document');
      }
    }
    await this.documentModel.findByIdAndUpdate(documentId,
      {
        $push: {
          activityLog: {
            userId: currentUser.userId,
            action: 'VIEWED',
            timestamp: new Date(),
          }
        }
      }
    );
    return this.mapToResponse(doc);
  }
}