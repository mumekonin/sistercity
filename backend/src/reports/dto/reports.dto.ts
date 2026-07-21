import { IsEnum, IsNotEmpty, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportType, ReportCity } from '../../common/enum/enum';
export class CreateReportDto {
  @IsEnum(ReportType)
  @IsNotEmpty()
  reportType!: ReportType;
  @IsEnum(ReportCity)
  @IsNotEmpty()
  city!: ReportCity;
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  dateFrom!: Date;
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  dateTo!: Date;
}
