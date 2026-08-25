import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveRequestEntity, LeaveTypeEnum } from '../entities/leave-request.entity';
import { FileService } from '../../file/file.service';
import { FileableType, FileType } from '../../file/entities/file.entity';

@Injectable()
export class UploadLeaveDocumentService {
  constructor(
    @InjectRepository(LeaveRequestEntity)
    private readonly leaveRequestRepository: Repository<LeaveRequestEntity>,
    private readonly fileService: FileService,
  ) {}

  /** restrictToEmployeeId scopes the lookup to one employee's own requests — used by the
   *  self-service endpoints so an hr:leave:self holder can only ever touch their own row. */
  async execute(
    tenantId: string,
    storeId: string,
    requestId: string,
    file: Express.Multer.File,
    restrictToEmployeeId?: string,
  ): Promise<LeaveRequestEntity> {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    const request = await this.leaveRequestRepository.findOne({
      where: { id: requestId, storeId, ...(restrictToEmployeeId ? { employeeId: restrictToEmployeeId } : {}) },
    });
    if (!request) {
      throw new NotFoundException('Leave request not found.');
    }

    if (request.leaveType !== LeaveTypeEnum.SICK) {
      throw new BadRequestException('A supporting document can only be attached to a sick leave request.');
    }

    const uploaded = await this.fileService.uploadSingle(
      file,
      request.id,
      FileableType.DOCUMENT,
      FileType.DOCUMENT,
      tenantId,
    );

    request.documentFileId = uploaded.id;
    return this.leaveRequestRepository.save(request);
  }
}
