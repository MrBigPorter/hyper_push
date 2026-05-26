import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class PromoteReleaseInput {
  @Field()
  serverId!: string;

  @Field()
  appName!: string;

  @Field()
  sourceDeploymentName!: string;

  @Field()
  destDeploymentName!: string;

  @Field({ nullable: true })
  appVersion?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  isMandatory?: boolean;

  @Field({ nullable: true })
  rollout?: number;
}
