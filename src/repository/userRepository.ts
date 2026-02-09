import { User, IUserDoc } from '../models/User';
import type { UserDto } from '../types/user';

function toUserDto(doc: IUserDoc): UserDto {
  return {
    id: doc.id,
    email: doc.email,
    name: doc.name,
    phone: doc.phone,
    plan: doc.plan,
    enrollmentDate: doc.enrollmentDate ? doc.enrollmentDate.toISOString() : null,
    isActive: doc.isActive,
  };
}

export const userRepository = {
  async findByEmail(email: string): Promise<IUserDoc | null> {
    return User.findOne({ email }).exec();
  },

  async create(data: {
    email: string;
    name: string;
    phone: string;
    plan?: string;
    enrollmentDate: Date;
    isActive: boolean;
  }): Promise<IUserDoc> {
    const user = new User({
      ...data,
      createdAt: new Date(),
    });
    await user.save();
    return user;
  },

  toUserDto,
};
