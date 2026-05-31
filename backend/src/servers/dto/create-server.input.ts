import { Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class CreateServerInput {
  @Field()
  @IsString()
  name!: string;

  @Field()
  @IsString()
  username!: string;

  @Field()
  @IsString()
  password!: string;
}
