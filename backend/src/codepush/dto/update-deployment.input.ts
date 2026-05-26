import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateDeploymentInput {
  @Field()
  serverId!: string;

  @Field()
  appName!: string;

  @Field()
  deploymentName!: string;

  @Field()
  newName!: string;
}
