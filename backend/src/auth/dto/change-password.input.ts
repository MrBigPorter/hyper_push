import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MinLength } from 'class-validator';

@InputType('ChangePasswordInput')
export class ChangePasswordInput {
  @Field()
  @IsString()
  currentPassword!: string;

  @Field()
  @IsString()
  @MinLength(8)
  newPassword!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  totpToken?: string;
}
