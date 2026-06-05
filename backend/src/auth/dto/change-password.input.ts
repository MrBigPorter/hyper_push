import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

@InputType('ChangePasswordInput')
export class ChangePasswordInput {
  @Field()
  @IsString()
  currentPassword!: string;

  @Field()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  totpToken?: string;
}
