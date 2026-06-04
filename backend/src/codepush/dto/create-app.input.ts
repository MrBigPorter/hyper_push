import { Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class CreateAppInput {
  @Field()
  @IsString()
  serverId!: string;

  @Field()
  @IsString()
  name!: string;

  @Field()
  @IsString()
  os!: string; // iOS | Android | Windows

  @Field()
  @IsString()
  platform!: string; // React-Native | Cordova
}
