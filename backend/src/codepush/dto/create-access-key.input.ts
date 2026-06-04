import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateAccessKeyInput {
  @Field()
  @IsString()
  serverId!: string;

  @Field()
  @IsString()
  friendlyName!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  ttl?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}
