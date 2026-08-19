import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Headers,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiResponse,
} from '@nestjs/swagger';
import { FileService } from './file.service';
import { FileUploadGuard } from './guards/file-upload.guard';
import { FileableType, FileType } from './entities/file.entity';

@ApiTags('File Storage & Media Management')
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @UseGuards(FileUploadGuard)
  @Post('upload-single')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single file/image with optimization' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body('fileableId') fileableId?: string,
    @Body('fileableType') fileableType: FileableType = FileableType.GENERAL,
    @Body('fileType') fileType: FileType = FileType.IMAGE,
    @Headers('x-store-id') storeId?: string,
    @Req() req?: any,
  ) {
    const tenantId = req?.user?.tenantId || storeId || 'common';
    const data = await this.fileService.uploadSingle(
      file,
      fileableId,
      fileableType,
      fileType,
      tenantId,
    );
    return {
      message: 'File uploaded successfully',
      data,
    };
  }

  @UseGuards(FileUploadGuard)
  @Post('upload-multiple')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple files/images (up to 10 files)' })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('fileableId') fileableId?: string,
    @Body('fileableType') fileableType: FileableType = FileableType.GENERAL,
    @Body('fileType') fileType: FileType = FileType.IMAGE,
    @Headers('x-store-id') storeId?: string,
    @Req() req?: any,
  ) {
    const tenantId = req?.user?.tenantId || storeId || 'common';
    const data = await this.fileService.uploadMultiple(
      files,
      fileableId,
      fileableType,
      fileType,
      tenantId,
    );
    return {
      message: 'Files uploaded successfully',
      data,
    };
  }

  @UseGuards(FileUploadGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all uploaded files for the tenant' })
  async findAll(@Headers('x-store-id') storeId?: string, @Req() req?: any) {
    const tenantId = req?.user?.tenantId || storeId;
    return this.fileService.findAll(tenantId);
  }

  @UseGuards(FileUploadGuard)
  @Get('by-entity/:fileableType/:fileableId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get files associated with a specific entity' })
  async findByFileable(
    @Param('fileableType') fileableType: FileableType,
    @Param('fileableId') fileableId: string,
    @Headers('x-store-id') storeId?: string,
    @Req() req?: any,
  ) {
    const tenantId = req?.user?.tenantId || storeId;
    return this.fileService.findByFileable(fileableType, fileableId, tenantId);
  }

  @UseGuards(FileUploadGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single file record by ID' })
  async findOne(
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
    @Req() req?: any,
  ) {
    const tenantId = req?.user?.tenantId || storeId;
    return this.fileService.findOne(id, tenantId);
  }

  @UseGuards(FileUploadGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a file and remove from storage' })
  async remove(
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
    @Req() req?: any,
  ) {
    const tenantId = req?.user?.tenantId || storeId;
    return this.fileService.remove(id, tenantId);
  }
}
