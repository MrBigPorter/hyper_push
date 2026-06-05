import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { RecaptchaService } from './recaptcha.service.js';

@Global()
@Module({
  imports: [HttpModule],
  providers: [RecaptchaService],
  exports: [RecaptchaService],
})
export class RecaptchaModule {}
