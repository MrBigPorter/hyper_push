import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType('AuditLog')
export class AuditLogModel {
  @Field(() => ID)
  id: string;

  @Field()
  action: string;

  @Field()
  entity: string;

  @Field({ nullable: true })
  entityId?: string;

  @Field({ nullable: true })
  detail?: string;

  @Field()
  userId: string;

  @Field({ nullable: true })
  ip?: string;

  @Field()
  createdAt: Date;
}
