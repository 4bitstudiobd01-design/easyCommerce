import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { EmployeeEntity } from '../entities/employee.entity';
import { UserEntity } from '../../user/entities/user.entity';

@Injectable()
export class GetMyEmployeeService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Resolves the HR employee record for the logged-in user's self-service session.
   *
   * `EmployeeEntity.linkedUserId` is set the first time this resolves successfully via
   * email match — there is no separate "accept self-service invite" step in the HR
   * module itself; the person accepts the ordinary staff invite (which creates their
   * UserEntity), and the first time they open a self-service page here, their employee
   * record is linked by matching UserEntity.email to EmployeeEntity.email. This avoids
   * coupling the HR module to the staff module's accept-invite flow.
   */
  async execute(storeId: string, userId: string): Promise<EmployeeEntity> {
    const linked = await this.employeeRepository.findOne({ where: { storeId, linkedUserId: userId } });
    if (linked) {
      return linked;
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user?.email) {
      const byEmail = await this.employeeRepository.findOne({
        where: { storeId, email: user.email.toLowerCase(), linkedUserId: IsNull() },
      });
      if (byEmail) {
        byEmail.linkedUserId = userId;
        return this.employeeRepository.save(byEmail);
      }
    }

    throw new NotFoundException(
      'Your account is not linked to an employee record for this store. Ask your HR admin to invite you to self-service using the same email address as your employee record.',
    );
  }
}
