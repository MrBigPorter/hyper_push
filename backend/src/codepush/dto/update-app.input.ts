import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateAppInput {
  @Field()
  serverId!: string;

  @Field()
  appName!: string;

  @Field()
  newName!: string;
}
