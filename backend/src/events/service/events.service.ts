import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event } from '../schema/events.schema';
import {
  ConfirmMinutesDto,
  CreateEventDto,
  UpdateEventDto,
} from '../dto/events.dto';
import { EventListResponse, EventResponse } from '../response/events.response';
import {
  EventStatus,
  Role,
  City,
  NotificationType,
  NotificationPriority,
} from 'src/common/enum/enum';
import { User } from 'src/users/schema/users.shema';
import { NotificationService } from 'src/notifications/service/notifications.service';
@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name)
    private readonly eventModel: Model<Event>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly notificationService: NotificationService,
  ) {}
  async createEvent(
    createEventDto: CreateEventDto,
    currentUser: any,
  ): Promise<EventResponse> {
    if (createEventDto.endDate <= createEventDto.startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const event = new this.eventModel({
      title: createEventDto.title,
      eventType: createEventDto.eventType,
      hostCity: createEventDto.hostCity,
      venue: createEventDto.venue,
      startDate: createEventDto.startDate,
      endDate: createEventDto.endDate,
      isPublic: createEventDto.isPublic,
      description: createEventDto.description,
      relatedProject: createEventDto.relatedProject ?? null,
      organizer: currentUser.userId,
      organizerCity: currentUser.city,
      agenda: createEventDto.agenda ?? [],
      status: EventStatus.UPCOMING,
      minutes: {
        summary: null,
        decisions: [],
        confirmedByAdama: false,
        confirmedByAurora: false,
      },
    });

    const saved = await event.save();
    // Notify both cities' admins about the new event
    const otherCity =
      currentUser.city === City.ADAMA ? City.AURORA : City.ADAMA;
    const otherCityAdmins = await this.userModel
      .find({ city: otherCity, role: Role.CITY_ADMIN, isActive: true })
      .select('_id')
      .lean();
    const otherCityAdminIds = otherCityAdmins.map((u: any) => u._id.toString());
    if (otherCityAdminIds.length) {
      await this.notificationService.createMany(otherCityAdminIds, {
        type: NotificationType.EVENT_REMINDER,
        title: `New event: ${createEventDto.title}`,
        body: `A new event has been scheduled by ${currentUser.city}. Starts: ${createEventDto.startDate}.`,
        link: `/events/${saved._id}`,
        priority: NotificationPriority.NORMAL,
      });
    }
    return this.toEventResponse(saved);
  }
  private toEventResponse(event: any): EventResponse {
    return {
      id: event._id.toString(),
      title: event.title,
      eventType: event.eventType,
      hostCity: event.hostCity,
      venue: event.venue,
      startDate: event.startDate,
      endDate: event.endDate,
      isPublic: event.isPublic,
      description: event.description,
      relatedProject: event.relatedProject?.toString() ?? null,
      organizer: event.organizer?.toString(),
      organizerCity: event.organizerCity,
      agenda: event.agenda.map((a: any) => ({
        title: a.title,
        duration: a.duration,
      })),
      status: event.status,
      minutes: {
        summary: event.minutes?.summary ?? null,
        decisions: event.minutes?.decisions ?? [],
        confirmedByAdama: event.minutes?.confirmedByAdama ?? false,
        confirmedByAurora: event.minutes?.confirmedByAurora ?? false,
      },
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
  async getAllEvents(
    currentUser: any,
    month?: number,
    year?: number,
  ): Promise<EventListResponse[]> {
    const filter: any = {};

    if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);
      filter.startDate = { $gte: startOfMonth, $lte: endOfMonth };
    }

    // PUBLIC or no login
    if (!currentUser || currentUser.role === 'PUBLIC') {
      filter.isPublic = true;
      filter.status = { $ne: EventStatus.CANCELLED };
    }

    // DEPT_OFFICER and CITY_ADMIN
    else if (currentUser.role !== Role.SUPER_ADMIN) {
      filter.$or = [
        { hostCity: currentUser.city },
        { organizerCity: currentUser.city },
        { isPublic: true },
      ];
    }
    const events = await this.eventModel
      .find(filter)
      .sort({ startDate: 1 })
      .lean();

    if (!events || events.length === 0) return [];

    return events.map((e) => this.toEventListResponse(e));
  }
  private toEventListResponse(event: any): EventListResponse {
    return {
      id: event._id.toString(),
      title: event.title,
      eventType: event.eventType,
      hostCity: event.hostCity,
      venue: event.venue,
      startDate: event.startDate,
      endDate: event.endDate,
      isPublic: event.isPublic,
      status: event.status,
      organizerCity: event.organizerCity,
      createdAt: event.createdAt,
    };
  }
  async getEventById(id: string, currentUser: any): Promise<EventResponse> {
    const event = await this.eventModel.findById(id).lean();
    if (!event) throw new NotFoundException('Event not found');
    if (!currentUser) {
      if (!event.isPublic) {
        throw new ForbiddenException('You do not have access to this event');
      }
      return this.toEventResponse(event);
    }
    // SUPER_ADMIN sees everything
    if (currentUser.role === Role.SUPER_ADMIN) {
      return this.toEventResponse(event);
    }
    // DEPT_OFFICER and CITY_ADMIN
    if (!event.isPublic) {
      const isInvolved =
        event.hostCity === currentUser.city ||
        event.organizerCity === currentUser.city;
      if (!isInvolved) {
        throw new ForbiddenException('You do not have access to this event');
      }
    }
    return this.toEventResponse(event);
  }
  async updateEvent(
    id: string,
    updateEventDto: UpdateEventDto,
    currentUser: any,
  ): Promise<EventResponse> {
    const event = await this.eventModel.findById(id);
    if (!event) throw new NotFoundException('Event not found');

    // only organizer city or SUPER_ADMIN can update
    if (
      currentUser.role !== Role.SUPER_ADMIN &&
      event.organizerCity !== currentUser.city
    ) {
      throw new ForbiddenException('You can only update your own city events');
    }

    // cannot update cancelled event
    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException('Cannot update a cancelled event');
    }

    switch (updateEventDto.action) {
      case 'update':
        if (updateEventDto.title) event.title = updateEventDto.title;
        if (updateEventDto.eventType)
          event.eventType = updateEventDto.eventType;
        if (updateEventDto.venue) event.venue = updateEventDto.venue;
        if (updateEventDto.startDate)
          event.startDate = updateEventDto.startDate;
        if (updateEventDto.endDate) event.endDate = updateEventDto.endDate;
        if (updateEventDto.isPublic !== undefined)
          event.isPublic = updateEventDto.isPublic;
        if (updateEventDto.description)
          event.description = updateEventDto.description;
        if (updateEventDto.relatedProject)
          event.relatedProject = updateEventDto.relatedProject as any;

        // endDate must be after startDate
        if (event.endDate <= event.startDate) {
          throw new BadRequestException('End date must be after start date');
        }
        break;
      case 'cancel':
        if ((event.status as any) !== EventStatus.UPCOMING) {
          throw new BadRequestException(
            `Cannot cancel an event with status ${event.status}`,
          );
        }
        event.status = EventStatus.CANCELLED;
        break;

      case 'add-agenda':
        if (!updateEventDto.agendaItem) {
          throw new BadRequestException('Agenda item is required');
        }
        event.agenda.push({
          title: updateEventDto.agendaItem.title,
          duration: updateEventDto.agendaItem.duration ?? null,
        });
        event.markModified('agenda');
        break;

      case 'upload-minutes':
        if ((event.status as any) === EventStatus.CANCELLED) {
          throw new BadRequestException(
            'Cannot upload minutes for a cancelled event',
          );
        }
        if (!updateEventDto.minutes) {
          throw new BadRequestException('Minutes are required');
        }
        event.minutes.summary = updateEventDto.minutes.summary;
        event.minutes.decisions = updateEventDto.minutes.decisions;
        event.status = EventStatus.COMPLETED;
        event.markModified('minutes');
        // Notify both cities' admins that minutes have been uploaded
        {
          const allAdmins = await this.userModel
            .find({ role: Role.CITY_ADMIN, isActive: true })
            .select('_id')
            .lean();
          const adminIds = allAdmins.map((u: any) => u._id.toString());
          if (adminIds.length) {
            await this.notificationService.createMany(adminIds, {
              type: NotificationType.EVENT_REMINDER,
              title: `Minutes uploaded: ${event.title}`,
              body: `Event minutes have been uploaded and are ready for confirmation.`,
              link: `/events/${event._id}`,
              priority: NotificationPriority.NORMAL,
            });
          }
        }
        break;

      default:
        throw new BadRequestException('Invalid action');
    }

    const updated = await event.save();
    return this.toEventResponse(updated);
  }
  async cancelEvent(id: string, currentUser: any): Promise<EventResponse> {
    const event = await this.eventModel.findById(id);
    if (!event) throw new NotFoundException('Event not found');

    // only organizer city or SUPER_ADMIN can cancel
    if (
      currentUser.role !== Role.SUPER_ADMIN &&
      event.organizerCity !== currentUser.city
    ) {
      throw new ForbiddenException('You can only cancel your own city events');
    }
    if ((event.status as any) === EventStatus.CANCELLED) {
      throw new BadRequestException('Event is already cancelled');
    }
    if ((event.status as any) === EventStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed event');
    }

    event.status = EventStatus.CANCELLED;
    await event.save();
    return this.toEventResponse(event);
  }
  async updateMinutes(
    id: string,
    confirmMinutesDto: ConfirmMinutesDto,
    currentUser: any,
  ): Promise<EventResponse> {
    const event = await this.eventModel.findById(id);
    if (!event) throw new NotFoundException('Event not found');

    // event must be COMPLETED
    if ((event.status as any) !== EventStatus.COMPLETED) {
      throw new BadRequestException(
        'Minutes can only be uploaded or confirmed for completed events',
      );
    }

    switch (confirmMinutesDto.action) {
      case 'upload':
        // only organizer city can upload minutes
        if (
          event.organizerCity !== currentUser.city &&
          currentUser.role !== Role.SUPER_ADMIN
        ) {
          throw new ForbiddenException(
            'Only the organizer city can upload minutes',
          );
        }

        if (!confirmMinutesDto.minutes) {
          throw new BadRequestException('Minutes content is required');
        }

        event.minutes.summary = confirmMinutesDto.minutes.summary;
        event.minutes.decisions = confirmMinutesDto.minutes.decisions;

        // reset confirmations when minutes are re-uploaded
        event.minutes.confirmedByAdama = false;
        event.minutes.confirmedByAurora = false;

        event.markModified('minutes');
        break;

      case 'confirm':
        // minutes must be uploaded first
        if (!event.minutes.summary) {
          throw new BadRequestException(
            'Minutes must be uploaded before confirming',
          );
        }

        // each city confirms their own
        if (currentUser.city === City.ADAMA) {
          if ((event.minutes.confirmedByAdama as any) === true) {
            throw new BadRequestException(
              'Adama has already confirmed the minutes',
            );
          }
          event.minutes.confirmedByAdama = true;
        }
        if (currentUser.city === City.AURORA) {
          if ((event.minutes.confirmedByAurora as any) === true) {
            throw new BadRequestException(
              'Aurora has already confirmed the minutes',
            );
          }
          event.minutes.confirmedByAurora = true;
        }
        // Notify the organizer city admins about the confirmation
        {
          const organizerAdmins = await this.userModel
            .find({
              city: event.organizerCity,
              role: Role.CITY_ADMIN,
              isActive: true,
            })
            .select('_id')
            .lean();
          const organizerAdminIds = organizerAdmins.map((u: any) =>
            u._id.toString(),
          );
          if (organizerAdminIds.length) {
            await this.notificationService.createMany(organizerAdminIds, {
              type: NotificationType.EVENT_REMINDER,
              title: `Minutes confirmed by ${currentUser.city}: ${event.title}`,
              body: `${currentUser.city} has confirmed the event minutes.`,
              link: `/events/${event._id}`,
              priority: NotificationPriority.NORMAL,
            });
          }
        }
        event.markModified('minutes');
        break;
      default:
        throw new BadRequestException('Invalid action');
    }
    const updated = await event.save();
    return this.toEventResponse(updated);
  }
}
