import { getPrismaClient } from "../db/postgres";
import { bucket, deleteFromS3, uploadToS3 } from "../lib/s3";

export class FilesService {
  private get db() {
    return getPrismaClient();
  }

  genFileKey(name: string) {
    return `${Date.now()}-${name}`;
  }

  getFileUrl(key: string) {
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }

  async upload(buffer: Buffer, originalName: string, mimeType: string, size: number) {
    const key = this.genFileKey(originalName);
    const url = this.getFileUrl(key);

    await uploadToS3(key, buffer, mimeType);

    return this.db.file.create({
      data: { key, url, name: originalName, size, mimeType, bucket },
    });
  }

  async softDelete(fileId: string) {
    await this.db.file.update({
      where: { id: fileId },
      data: { deletedAt: new Date() },
    });
  }

  async cleanDeletedFiles() {
    const files = await this.db.file.findMany({ where: { deletedAt: { not: null } } });

    for (const file of files) {
      try {
        await deleteFromS3(file.key);
        await this.db.file.delete({ where: { id: file.id } });
      } catch (err) {
        console.error(`Failed to clean file ${file.id}:`, err);
      }
    }
  }
}
