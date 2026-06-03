import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('User')
export class UserModel {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field({ nullable: true })
  name?: string;

  @Field()
  role!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
