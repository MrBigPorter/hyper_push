import { Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class UpdateDeploymentInput {
  @Field()
  @IsString()
  serverId!: string;

  @Field()
  @IsString()
  appName!: string;

  @Field()
  @IsString()
  deploymentName!: string;

  @Field()
  @IsString()
  newName!: string;
}
