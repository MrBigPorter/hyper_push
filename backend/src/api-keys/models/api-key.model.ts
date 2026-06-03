import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('ApiKey')
export class ApiKeyModel {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  key: string;

  @Field()
  active: boolean;

  @Field()
  userId: string;

  @Field({ nullable: true })
  expiresAt?: Date;

  @Field({ nullable: true })
  lastUsed?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
