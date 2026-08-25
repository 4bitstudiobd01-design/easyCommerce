import { Injectable } from '@nestjs/common';
import { CustomerEntity } from '../../entities/customer.entity';
import { UpdateCustomerService } from '../../services/update-customer.service';
import { UpdateMyProfileDto } from '../dto/update-my-profile.dto';

/**
 * Thin wrapper over the merchant-side UpdateCustomerService — same
 * (id, tenantId)-scoped uniqueness checks apply regardless of who is
 * editing. UpdateMyProfileDto structurally excludes status/source, so a
 * customer can never smuggle a merchant-only field through this path.
 */
@Injectable()
export class UpdateMyProfileService {
  constructor(private readonly updateCustomerService: UpdateCustomerService) {}

  async execute(customerId: string, tenantId: string, dto: UpdateMyProfileDto): Promise<CustomerEntity> {
    return this.updateCustomerService.execute(customerId, tenantId, dto);
  }
}
