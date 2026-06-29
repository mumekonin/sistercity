import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Message } from "../schema/communication.schema";
import { Model } from "mongoose";
import { MessageResponse } from "../response/communication.response";
import { MessageStatus } from "src/common/enum/enum";

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
  ) { }
  async getMessageById(id: string, currentUser: any): Promise<MessageResponse> {
    const message = await this.messageModel.findById(id).lean();
    if (!message) throw new NotFoundException('Message not found');

    const hasAccess =
      message.from.userId.toString() === currentUser.userId ||
      (message.to.city === currentUser.city &&
        message.to.department === currentUser.department) ||
      (message.to.userId &&
        message.to.userId.toString() === currentUser.userId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this message');
    }
    if (message.status === MessageStatus.SENT && message.to.city === currentUser.city) {
      await this.messageModel.findByIdAndUpdate(id, { status: MessageStatus.READ, readAt: new Date() });
      message.status = MessageStatus.READ;
      message.readAt = new Date();
    }
    const thread = await this.messageModel.find({ threadId: message.threadId }).sort({ createdAt: 1 }).lean();

    return this.toMessageResponse(message, thread);
  }
  private toMessageResponse(message: any, thread: any[] = []): MessageResponse {
    return {
      id: message._id.toString(),
      referenceNumber: message.referenceNumber,
      threadId: message.threadId?.toString() ?? null,
      parentId: message.parentId?.toString() ?? null,
      from: {
        userId: message.from.userId.toString(),
        city: message.from.city,
        department: message.from.department,
        name: message.from.name,
      },
      to: {
        city: message.to.city,
        department: message.to.department,
        userId: message.to.userId?.toString() ?? null,
      },
      subject: message.subject,
      messageType: message.messageType,
      priority: message.priority,
      body: message.body,
      attachments: message.attachments.map((a: any) => ({
        documentId: a.documentId.toString(),
        fileName: a.fileName,
        fileUrl: a.fileUrl,
      })),
      relatedProject: message.relatedProject?.toString() ?? null,
      status: message.status,
      readAt: message.readAt,
      responseDeadline: message.responseDeadline,
      isEscalated: message.isEscalated,
      isArchived: message.isArchived,
      thread: thread.map((t: any) => ({
        id: t._id.toString(),
        referenceNumber: t.referenceNumber,
        from: {
          userId: t.from.userId.toString(),
          city: t.from.city,
          department: t.from.department,
          name: t.from.name,
        },
        body: t.body,
        createdAt: t.createdAt,
      })),
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
}