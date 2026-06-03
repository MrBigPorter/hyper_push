import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('Server')
export class ServerModel {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  username: string;

  @Field()
  apiKey: string;

  @Field()
  isOnline: boolean;

  @Field()
  userId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
