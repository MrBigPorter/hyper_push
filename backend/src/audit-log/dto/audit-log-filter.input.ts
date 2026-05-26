import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class AuditLogFilterInput {
  @Field({ nullable: true })
  entity?: string;

  @Field({ nullable: true })
  action?: string;

  @Field(() => Int, { nullable: true })
  page?: number;

  @Field(() => Int, { nullable: true })
  pageSize?: number;
}
