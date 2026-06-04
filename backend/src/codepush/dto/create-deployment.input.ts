import { Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class CreateDeploymentInput {
  @Field()
  @IsString()
  serverId!: string;

  @Field()
  @IsString()
  appName!: string;

  @Field()
  @IsString()
  name!: string;
}
