import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateAccessKeyInput {
  @Field()
  serverId!: string;

  @Field()
  friendlyName!: string;

  @Field({ nullable: true })
  createdBy?: string;

  @Field(() => Int, { nullable: true })
  ttl?: number;

  @Field({ nullable: true })
  description?: string;
}
