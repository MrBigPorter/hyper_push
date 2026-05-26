import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateAppInput {
  @Field()
  serverId!: string;

  @Field()
  name!: string;

  @Field()
  os!: string; // iOS | Android | Windows

  @Field()
  platform!: string; // React-Native | Cordova
}
