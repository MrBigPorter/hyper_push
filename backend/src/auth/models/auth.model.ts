import { Field, ObjectType } from '@nestjs/graphql';
import { UserModel } from './user.model.js';

@ObjectType('Auth')
export class AuthModel {
  @Field({ nullable: true })
  accessToken?: string;

  @Field({ nullable: true })
  requires2fa?: boolean;

  @Field({ nullable: true })
  tempToken?: string;

  @Field(() => UserModel)
  user!: UserModel;
}
