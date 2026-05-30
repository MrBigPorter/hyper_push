import { Field, ObjectType } from '@nestjs/graphql';
import { AuditLogModel } from './audit-log.model.js';
import { PaginationInfoModel } from './pagination-info.model.js';

@ObjectType('AuditLogListResponse')
export class AuditLogListResponseModel {
  @Field(() => [AuditLogModel])
  items: AuditLogModel[];

  @Field(() => PaginationInfoModel)
  pagination: PaginationInfoModel;
}
