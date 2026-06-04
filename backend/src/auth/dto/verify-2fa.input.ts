import { Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType('Verify2faInput')
export class Verify2faInput {
  @Field()
  @IsString()
  token!: string;

  @Field()
  @IsString()
  tempToken!: string;
}
