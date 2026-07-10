import { ReportType, ReportCity } from '../../common/enum/enum';
export class ReportResponse {
  id!: string;
  reportType!: ReportType;
  generatedBy!: string;
  city!: ReportCity;
  dateFrom!: Date;
  dateTo!: Date;
  data!: Record<string, any>;
  generatedAt!: Date;
  createdAt!: Date;
}
export class ReportListResponse {
  id!: string;
  reportType!: ReportType;
  generatedBy!: string;
  city!: ReportCity;
  dateFrom!: Date;
  dateTo!: Date;
  generatedAt!: Date;
  createdAt!: Date;
}