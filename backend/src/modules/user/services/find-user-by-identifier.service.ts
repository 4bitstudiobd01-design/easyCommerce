import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { normalizePhone } from '../../../common/utils/normalize-phone.util';

/**
 * Resolves a user from a login identifier that may be either an email address
 * or a phone number. The login form presents a single "Email or Phone" field,
 * so the identifier type is detected here rather than at the boundary.
 */
@Injectable()
export class FindUserByIdentifierService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(identifier: string): Promise<UserEntity | null> {
    const value = identifier.trim();

    if (value.includes('@')) {
      return this.userRepository.findOne({
        where: { email: value.toLowerCase() },
      });
    }

    // `phone` carries no unique constraint, so a number shared by several
    // accounts is possible. Authenticating an arbitrary "first match" would let
    // one account shadow another, so an ambiguous number is treated as unusable
    // for login and the caller must sign in with their email instead.
    const matches = await this.userRepository.find({
      where: { phone: normalizePhone(value) },
      take: 2,
    });

    return matches.length === 1 ? matches[0] : null;
  }
}
