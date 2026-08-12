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
    return { message: 'تم إنشاء المدير بنجاح' };
  }
}
