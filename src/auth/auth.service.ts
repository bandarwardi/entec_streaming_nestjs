import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Admin, AdminDocument } from '../schemas/admin.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    private jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const admin = await this.adminModel.findOne({ username });
    if (!admin) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

    const payload = { sub: admin._id, username: admin.username };
    return {
      access_token: this.jwtService.sign(payload),
      admin: { username: admin.username },
    };
  }

  async createAdmin(username: string, password: string) {
    const exists = await this.adminModel.findOne({ username });
    if (exists) throw new ConflictException('المستخدم موجود بالفعل');

    const hashed = await bcrypt.hash(password, 10);
    const admin = new this.adminModel({ username, password: hashed });
    await admin.save();
    return { _id: admin._id, username: admin.username, createdAt: (admin as any).createdAt };
  }

  async getAdmins() {
    return this.adminModel.find({}, '-password').sort({ createdAt: -1 });
  }

  async updateAdmin(id: string, updateData: { username?: string; password?: string }) {
    const admin = await this.adminModel.findById(id);
    if (!admin) throw new ConflictException('المدير غير موجود');

    if (updateData.username && updateData.username !== admin.username) {
      const exists = await this.adminModel.findOne({ username: updateData.username });
      if (exists) throw new ConflictException('اسم المستخدم موجود بالفعل');
      admin.username = updateData.username;
    }

    if (updateData.password) {
      admin.password = await bcrypt.hash(updateData.password, 10);
    }

    await admin.save();
    return { _id: admin._id, username: admin.username, updatedAt: (admin as any).updatedAt };
  }

  async deleteAdmin(id: string) {
    const admin = await this.adminModel.findById(id);
    if (!admin) throw new ConflictException('المدير غير موجود');
    
    // Prevent deleting the last admin
    const count = await this.adminModel.countDocuments();
    if (count <= 1) throw new ConflictException('لا يمكن حذف المدير الوحيد في النظام');

    await this.adminModel.findByIdAndDelete(id);
    return { message: 'تم الحذف بنجاح' };
  }
}
