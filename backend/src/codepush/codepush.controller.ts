import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CodepushService } from './codepush.service.js';

/**
 * Minimal Multer file interface (avoids dependency on Express type augmentation).
 */
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

/**
 * REST controller for multipart release upload.
 * GraphQL cannot handle file uploads natively, so we expose a REST endpoint
 * that the frontend calls with FormData (zip file + metadata).
 */
@Controller('codepush')
export class CodepushController {
  constructor(private readonly codepushService: CodepushService) {}

  /**
   * POST /api/codepush/upload/:serverId/:appName/:deploymentName
   *
   * Accepts multipart/form-data with:
   *   - packageInfo: JSON string { appVersion, description?, isMandatory?, rollout?, targetBinaryVersion? }
   *   - package:     .zip file (the actual update bundle)
   *
   * Forwards to: POST /apps/:appName/deployments/:deploymentName/release
   */
  @Post('upload/:serverId/:appName/:deploymentName')
  @UseInterceptors(FileInterceptor('package'))
  async uploadRelease(
    @Param('serverId') serverId: string,
    @Param('appName') appName: string,
    @Param('deploymentName') deploymentName: string,
    @UploadedFile() packageFile: MulterFile,
    @Body('packageInfo') packageInfoRaw?: string,
  ) {
    if (!packageFile) {
      throw new BadRequestException('Missing package file (field name: "package")');
    }

    // Build FormData matching what lisong/code-push-server expects
    const formData = new FormData();

    // packageInfo as JSON string field
    const packageInfo = packageInfoRaw ?? '{}';
    formData.append('packageInfo', packageInfo);

    // package as a Blob (zip file)
    const blob = new Blob([packageFile.buffer], {
      type: packageFile.mimetype || 'application/octet-stream',
    });
    formData.append('package', blob, packageFile.originalname || 'update.zip');

    const path = `/apps/${encodeURIComponent(appName)}/deployments/${encodeURIComponent(deploymentName)}/release`;

    return this.codepushService.forwardMultipart(serverId, 'POST', path, formData);
  }
}
