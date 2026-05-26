import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateApiKeyInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  expiresAt?: string;
}
