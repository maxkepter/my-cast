import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtGuard, Role, RoleGuard, Roles } from '../../../../features/auth/contracts/auth.contract';
import { CreateStorageNodeReq, StorageNodeListQueryReq, UpdateStorageNodeReq } from '../../dtos/req.dto';
import { StorageNodeAdminService } from '../../application/services/storage-node-admin.service';
import { StorageExceptionInterceptor } from '../interceptors/storage-exception.interceptor';

@Controller('admin/storage-nodes')
@UseGuards(JwtGuard, RoleGuard)
@UseInterceptors(StorageExceptionInterceptor)
@Roles(Role.ADMIN)
export class StorageAdminController {
  constructor(private readonly storageNodeAdmin: StorageNodeAdminService) {}

  @Get()
  list(@Query() query: StorageNodeListQueryReq) {
    return this.storageNodeAdmin.list(query);
  }

  @Post()
  create(@Body() input: CreateStorageNodeReq) {
    return this.storageNodeAdmin.create(input);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: UpdateStorageNodeReq) {
    return this.storageNodeAdmin.update(id, input);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.storageNodeAdmin.remove(id);
  }

  @Post(':id/health-check')
  healthCheck(@Param('id') id: string) {
    return this.storageNodeAdmin.healthCheck(id);
  }
}
