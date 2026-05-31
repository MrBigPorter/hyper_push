import { Field, InputType } from '@nestjs/graphql';

@InputType('UpdateUserInput')
export class UpdateUserInput {
  @Field()
  id!: string;

  @Field({ nullable: true })
  name?: string;
}
