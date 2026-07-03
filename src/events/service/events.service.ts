import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Event } from "../schema/events.schema";
import { CreateEventDto } from "../dto/events.dto";
import { EventResponse } from "../response/events.response";
import { EventStatus } from "src/common/enum/enum";
@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name)
    private readonly eventModel: Model<Event>,
  ) { }
  async createEvent(createEventDto: CreateEventDto, currentUser: any): Promise<EventResponse> {
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
        confirmedBySheger: false,
      },
    });

    const saved = await event.save();
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
        confirmedBySheger: event.minutes?.confirmedBySheger ?? false,
      },
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}