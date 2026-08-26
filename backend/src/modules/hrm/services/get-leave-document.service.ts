import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { LeaveRequestEntity } from '../entities/leave-request.entity';
import { FileService } from '../../file/file.service';

export interface LeaveDocumentStream {
  stream: fs.ReadStream;
  fileName: string;
  mimeType: string;
}

@Injectable()
export class GetLeaveDocumentService {
  constructor(
    @InjectRepository(LeaveRequestEntity)
    private readonly leaveRequestRepository: Repository<LeaveRequestEntity>,
    private readonly fileService: FileService,
  ) {}

  /**
   * Streams the sick-leave document straight from disk after checking access, rather
   * than ever handing back the file module's own public URL — that URL is a bare
   * unauthenticated static path, which is fine for a product photo but not for a
   * medical document.
   *
   * Local storage only for now: this repo's storage driver is env-selected
   * (STORAGE_DRIVER=s3 vs the local default), and the file module has no signed-URL
   * path for S3 yet. Flagging rather than silently ignoring — a store running with
   * STORAGE_DRIVER=s3 needs that added before this feature is safe to rely on there.
   */
  /** restrictToEmployeeId scopes the lookup to one employee's own requests — used by the
   *  self-service endpoints so an hr:leave:self holder can only ever touch their own row. */
  async execute(storeId: string, requestId: string, restrictToEmployeeId?: string): Promise<LeaveDocumentStream> {
    const request = await this.leaveRequestRepository.findOne({
      where: { id: requestId, storeId, ...(restrictToEmployeeId ? { employeeId: restrictToEmployeeId } : {}) },
    });
    if (!request || !request.documentFileId) {
      throw new NotFoundException('No document attached to this leave request.');
    }

    const file = await this.fileService.findOne(request.documentFileId);

    if (process.env.STORAGE_DRIVER?.toLowerCase() === 's3') {
      throw new BadRequestException(
        'Secure document retrieval is not yet implemented for S3 storage. Switch STORAGE_DRIVER to local, or implement signed-URL retrieval before relying on this in an S3 deployment.',
      );
    }

    if (!fs.existsSync(file.path)) {
      throw new NotFoundException('The stored file could not be found on disk.');
    }

    return {
      stream: fs.createReadStream(file.path),
      fileName: file.fileName,
      mimeType: file.mimeType,
    };
  }
}
