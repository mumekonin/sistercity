import { Injectable, NotFoundException, ForbiddenException, BadRequestException, } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateMessageDto, ReplyMessageDto, UpdateMessageDto, } from '../dto/communication.dto';
import { MessageResponse, MessageListResponse, ThreadItemResponse } from '../response/communication.response';
import { MessageStatus, MessagePriority, Role } from '../../common/enum/enum';
import { Message } from '../schema/communication.schema';
import { User } from 'src/users/schema/users.shema';
import { Types } from 'mongoose';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) { }

  private async generateReferenceNumber(city: string): Promise<string> {
    const year = new Date().getFullYear();
    // count messages per city per year
    const count = await this.messageModel.countDocuments({ 'from.city': city, createdAt: { $gte: new Date(`${year}-01-01`) } } as any);

    const sequence = String(count + 1).padStart(4, '0');
    return `${city.slice(0, 3)}-SC/${year}/${sequence}`;
  }
  private calculateDeadline(priority: MessagePriority): Date {
    const deadlineDays = {
      [MessagePriority.NORMAL]: 5,
      [MessagePriority.URGENT]: 2,
      [MessagePriority.CRITICAL]: 1,
    };
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + deadlineDays[priority]);
    return deadline;
  }
  // Send Message
  async sendMessage(createMessageDto: CreateMessageDto, currentUser: any): Promise<MessageResponse> {
    const sender = await this.userModel.findById(currentUser.userId);
    if (!sender) throw new NotFoundException('Sender not found');
    const referenceNumber = await this.generateReferenceNumber(currentUser.city);
    const responseDeadline = this.calculateDeadline(createMessageDto.priority);
    const message = new this.messageModel({
      referenceNumber,
      responseDeadline,
      threadId: null,
      parentId: null,
      from: {
        userId: currentUser.userId,
        city: currentUser.city,
        department: currentUser.department,
        name: sender.fullName,
      },
      to: {
        city: createMessageDto.to.city,
        department: createMessageDto.to.department,
        userId: createMessageDto.to.userId ?? null,
      },
      subject: createMessageDto.subject,
      messageType: createMessageDto.messageType,
      priority: createMessageDto.priority,
      body: createMessageDto.body,
      attachments: createMessageDto.attachments ?? [],
      relatedProject: createMessageDto.relatedProject ?? null,
      status: MessageStatus.SENT,
      readAt: null,
      isEscalated: false,
      isArchived: false,
    });

    const saved = await message.save();
    const updated = await this.messageModel
      .findByIdAndUpdate(
        saved._id,
        { threadId: saved._id },
        { new: true },
      )
      .lean();
    if (!updated) throw new NotFoundException('Message not found after save');
    return this.toMessageResponse(updated, []);
  }


  private toMessageResponse(message: any, thread: any[]): MessageResponse {
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
async getMessages(currentUser: any, type: string = 'received'): Promise<MessageListResponse[]> {
  let filter: any = {};

  switch (type) {
   case 'received':
  filter = {
    'to.city': currentUser.city,
    'to.department': currentUser.department,
    isArchived: { $in: [false, null, undefined] },
  };
  break;

case 'sent':
  
  filter = {
    'from.userId':  currentUser.userId,
    isArchived: { $in: [false, null, undefined] }, 
  };
  break;

case 'urgent':
  filter = {
    'to.city': currentUser.city,
    priority: { $in: [MessagePriority.URGENT, MessagePriority.CRITICAL] },
    isArchived: { $in: [false, null, undefined] },
  };
  break;

case 'unread':
  filter = {
    'to.city': currentUser.city,
    'to.department': currentUser.department,
    status: MessageStatus.SENT,
    isArchived: { $in: [false, null, undefined] }, 
  };
  break;

default:
  filter = {
    'to.city': currentUser.city,
    isArchived: { $in: [false, null, undefined] },
  };
  }

  console.log('filter:', JSON.stringify(filter));

  const messages = await this.messageModel
    .find(filter)
    .sort({ createdAt: -1 })
    .lean();
  if (!messages || messages.length === 0) return [];

  return messages.map((m) => this.toMessageListResponse(m));
}

  private toMessageListResponse(message: any): MessageListResponse {
    return {
      id: message._id.toString(),
      referenceNumber: message.referenceNumber,
      threadId: message.threadId?.toString() ?? null,
      subject: message.subject,
      messageType: message.messageType,
      priority: message.priority,
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
      status: message.status,
      isEscalated: message.isEscalated,
      responseDeadline: message.responseDeadline,
      createdAt: message.createdAt,
    };
  }
async getMessageById(id: string, currentUser: any): Promise<MessageResponse> {
  const message = await this.messageModel.findById(id).lean();
  if (!message) throw new NotFoundException('Message not found');
  const hasAccess =
    message.from.userId.toString() === currentUser.userId ||
    (message.to.userId &&
      message.to.userId.toString() === currentUser.userId) ||
    (message.to.city === currentUser.city &&
      message.to.department === currentUser.department) ||
    (currentUser.role === Role.CITY_ADMIN &&
      message.to.city === currentUser.city) ||
    currentUser.role === Role.SUPER_ADMIN;

  if (!hasAccess) {
    throw new ForbiddenException('You do not have access to this message');
  }
  if (message.status === MessageStatus.SENT && message.to.city === currentUser.city) {
    await this.messageModel.findByIdAndUpdate(id, {status: MessageStatus.READ,readAt: new Date()});
    message.status = MessageStatus.READ;
    message.readAt = new Date();
  }
  const thread = await this.messageModel.find({threadId: message.threadId,_id: { $ne: message._id },}).sort({ createdAt: 1 }).lean();

  return this.toMessageResponse(message, thread);
}

// Reply to Message
async replyToMessage(id: string,replyMessageDto: ReplyMessageDto,currentUser: any): Promise<MessageResponse> {
  const parentMessage = await this.messageModel.findById(id);
  if (!parentMessage) throw new NotFoundException('Message not found');
  const sender = await this.userModel.findById(currentUser.userId);
  if (!sender) throw new NotFoundException('Sender not found');
  const isRecipient = parentMessage.to.city === currentUser.city && parentMessage.to.department === currentUser.department;
  if (!isRecipient) {
    throw new ForbiddenException('Only the recipient can reply to this message');
  }
  if (parentMessage.status === MessageStatus.CLOSED) {
    throw new BadRequestException('Cannot reply to a closed message');
  }

  const referenceNumber = await this.generateReferenceNumber(currentUser.city);
  const responseDeadline = this.calculateDeadline(parentMessage.priority as unknown as MessagePriority);

  const reply = new this.messageModel({
    referenceNumber,
    responseDeadline,
    threadId: parentMessage.threadId,
    parentId: parentMessage._id,
    from: {
      userId: currentUser.userId,
      city: currentUser.city,
      department: currentUser.department,
      name: sender.fullName,
    },
    to: {
      city: parentMessage.from.city,
      department: parentMessage.from.department,
      userId: parentMessage.from.userId,
    },
    subject: `RE: ${parentMessage.subject}`,
    messageType: parentMessage.messageType,
    priority: parentMessage.priority,
    body: replyMessageDto.body,
    attachments: replyMessageDto.attachments ?? [],
    relatedProject: parentMessage.relatedProject,
    status: MessageStatus.SENT,
    readAt: null,
    isEscalated: false,
    isArchived: false,
  });

  const savedReply = await reply.save();
  parentMessage.status = MessageStatus.REPLIED as unknown as typeof parentMessage.status;
  await parentMessage.save();
  return this.toMessageResponse(savedReply, []);
}
// Update Message 
async updateMessage(id: string,updateMessageDto: UpdateMessageDto,
currentUser: any): Promise<MessageResponse> {
  const message = await this.messageModel.findById(id);
  if (!message) throw new NotFoundException('Message not found');
  if (currentUser.role === Role.CITY_ADMIN) {
    if (message.to.city !== currentUser.city) {
      throw new ForbiddenException('You can only manage messages for your own city');
    }
  }

  switch (updateMessageDto.action) {
    case 'escalate':
      if (message.isEscalated) {
        throw new BadRequestException('Message is already escalated');
      }
      message.isEscalated = true;
      message.status = MessageStatus.ESCALATED as unknown as typeof message.status;
      break;

    case 'close':
      if (message.status === MessageStatus.CLOSED as unknown as typeof message.status) {
        throw new BadRequestException('Message is already closed');
      }
      message.status = MessageStatus.CLOSED as unknown as typeof message.status;
      break;

    default:
      throw new BadRequestException('Invalid action');
  }

  const updated = await message.save();
  return this.toMessageResponse(updated, []);
}

// Get Overdue Messages
async getOverdueMessages(currentUser: any): Promise<MessageListResponse[]> {
  const messages = await this.messageModel
    .find({
      'to.city': currentUser.city,
      responseDeadline: { $lt: new Date() },
      status: { $in: [MessageStatus.SENT, MessageStatus.READ] },
      isArchived: false,
    } as any).sort({ responseDeadline: 1 }).lean();

  if (!messages || messages.length === 0) return [];

  return messages.map((m) => this.toMessageListResponse(m));
}
}