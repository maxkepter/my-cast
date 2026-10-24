import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthModule } from '../../../../features/auth/auth.module';
import { Roles } from '../../../../features/auth/infra/decorators/role.decorator';
import { JwtGuard } from '../../../../features/auth/infra/guards/jwt.guard';
import { RoleGuard } from '../../../../features/auth/infra/guards/role.guard';
import { Role } from '../../../../features/user/domain/enums/role.enum';

//pony_tail: Auth currently exports guards only; public auth barrel/contracts are the upgrade path.
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
