import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from '../projects/schema/projects.schema';
import { Message } from '../communication/schema/communication.schema';
import { Role } from '../common/enum/enum';
import { News } from 'src/news/schema/news.schema ';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
    @InjectModel(Event.name)
    private readonly eventModel: Model<Event>,
    @InjectModel(News.name)
    private readonly newsModel: Model<News>,
  ) { }

  async search(query: string, type?: string, currentUser?: any): Promise<any> {
    if (!query) throw new BadRequestException('Search query is required');

    const results: any = { projects: [], messages: [], events: [], news: [] };

    // search projects
    if (!type || type === 'projects') {
      if (currentUser) {
        const projects = await this.projectModel.find({ $text: { $search: query } }).select('title description status priority proposedBy adama aurora').lean();

        results.projects = projects
          .filter((p: any) => {
            if (currentUser.role === Role.SUPER_ADMIN) return true;
            if (currentUser.role === Role.CITY_ADMIN) {
              return (
                p.proposedBy === currentUser.city ||
                p.adama !== null ||
                p.aurora !== null
              );
            }
            if (currentUser.role === Role.DEPT_OFFICER) {
              return (
                p.adama?.department === currentUser.department ||
                p.aurora?.department === currentUser.department
              );
            }
            return false;
          })
          .map((p: any) => ({
            id: p._id.toString(),
            title: p.title,
            description: p.description,
            status: p.status,
            link: `/projects/${p._id}`,
          }));
      }
    }

    // search messages
    if (!type || type === 'messages') {
      if (currentUser) {
        const messages = await this.messageModel
          .find({
            $text: { $search: query },
            $or: [
              { 'from.userId': currentUser.userId },
              { 'to.city': currentUser.city },
            ],
          })
          .select('subject referenceNumber status from to')
          .lean();

        results.messages = messages.map((m: any) => ({
          id: m._id.toString(),
          subject: m.subject,
          referenceNumber: m.referenceNumber,
          status: m.status,
          link: `/messages/${m._id}`,
        }));
      }
    }

    // search events
    if (!type || type === 'events') {
      const eventFilter: any = { $text: { $search: query } };
      if (!currentUser) eventFilter.isPublic = true;

      const events = await this.eventModel
        .find(eventFilter)
        .select('title eventType hostCity startDate status')
        .lean();

      results.events = events.map((e: any) => ({
        id: e._id.toString(),
        title: e.title,
        eventType: e.eventType,
        hostCity: e.hostCity,
        startDate: e.startDate,
        link: `/events/${e._id}`,
      }));
    }

    // search news
    if (!type || type === 'news') {
      const news = await this.newsModel
        .find({
          $text: { $search: query },
          publishedAt: { $ne: null },
          isPublic: true,
        })
        .select('title category postedByCity publishedAt')
        .lean();

      results.news = news.map((n: any) => ({
        id: n._id.toString(),
        title: n.title,
        category: n.category,
        postedByCity: n.postedByCity,
        link: `/news/${n._id}`,
      }));
    }

    return results;
  }
}