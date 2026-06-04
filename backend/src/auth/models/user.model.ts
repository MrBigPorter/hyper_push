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

  // === NEW FIELDS ===

  @Field()
  totpEnabled!: boolean;

  @Field({ nullable: true })
  lastLoginAt?: Date;

  @Field()
  banned!: boolean;

  @Field({ nullable: true })
  bannedAt?: Date;

  @Field({ nullable: true })
  bannedReason?: string;
}
