import { Field, ObjectType, ID } from '@nestjs/graphql';

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
  userId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
