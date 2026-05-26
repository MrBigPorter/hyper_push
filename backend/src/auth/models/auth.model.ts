import { Field, ObjectType } from '@nestjs/graphql';
import { UserModel } from './user.model.js';

@ObjectType('Auth')
export class AuthModel {
  @Field()
  accessToken!: string;

  @Field(() => UserModel)
  user!: UserModel;
}
