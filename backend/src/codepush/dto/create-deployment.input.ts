import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateDeploymentInput {
  @Field()
  serverId!: string;

  @Field()
  appName!: string;

  @Field()
  name!: string;
}
