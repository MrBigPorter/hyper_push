import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateReleaseInput {
  @Field()
  serverId!: string;

  @Field()
  appName!: string;

  @Field()
  deploymentName!: string;

  @Field()
  label!: string;

  @Field({ nullable: true })
  isDisabled?: boolean;

  @Field({ nullable: true })
  isMandatory?: boolean;

  @Field({ nullable: true })
  rollout?: number;

  @Field({ nullable: true })
  appVersion?: string;

  @Field({ nullable: true })
  description?: string;
}
