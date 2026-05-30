import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType('PaginationInfo')
export class PaginationInfoModel {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  pageSize: number;

  @Field(() => Int)
  totalPages: number;
}
