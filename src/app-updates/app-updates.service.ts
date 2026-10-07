import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { APP_UPDATE_PLATFORMS, AppUpdate, AppUpdateDocument, AppUpdatePlatform } from '../schemas/app-update.schema';

export type SaveAppUpdateInput = {
  version: string;
  downloadUrl?: string;
  sha256?: string;
};

@Injectable()
export class AppUpdatesService {
  constructor(@InjectModel(AppUpdate.name) private readonly updateModel: Model<AppUpdateDocument>) {}

  async getLatestUpdate(platform: AppUpdatePlatform): Promise<AppUpdate | null> {
    return this.updateModel.findOne({ platform }).lean().exec() as Promise<AppUpdate | null>;
  }

  async getAllUpdates(): Promise<AppUpdate[]> {
    return this.updateModel.find().lean().exec() as Promise<AppUpdate[]>;
  }

  async saveUpdate(platform: AppUpdatePlatform, input: SaveAppUpdateInput): Promise<AppUpdate> {
    const version = input.version?.trim();
    const downloadUrl = input.downloadUrl?.trim() || '';
    const sha256 = input.sha256?.trim().toLowerCase() || '';

    if (!APP_UPDATE_PLATFORMS.includes(platform)) throw new BadRequestException('Unsupported update platform.');

    if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
      throw new BadRequestException('Version must use major.minor.patch format.');
    }
    if (platform !== 'web' || downloadUrl) {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(downloadUrl);
      } catch {
        throw new BadRequestException('A valid HTTPS update URL is required.');
      }
      if (parsedUrl.protocol !== 'https:') {
        throw new BadRequestException('The update must be hosted over HTTPS.');
      }
    }
    if (platform === 'windows' && !/^[a-f\d]{64}$/.test(sha256)) {
      throw new BadRequestException('A valid SHA-256 checksum is required to verify the installer.');
    }
    if (sha256 && !/^[a-f\d]{64}$/.test(sha256)) {
      throw new BadRequestException('The SHA-256 checksum must contain 64 hexadecimal characters.');
    }

    return this.updateModel.findOneAndUpdate(
      { platform },
      { $set: { platform, version, downloadUrl, sha256 } },
      { new: true, upsert: true, runValidators: true },
    ).exec();
  }
}
