import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(email);
        if (user && await bcrypt.compare(pass, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        // 'user' might be the full mongoose doc, or the result from validateUser
        // If it's a doc, user._doc (with lean) or access properties directly depending on object structure
        // But validateUser returns { ...result } which is the lean object without password if found.
        const payload = { email: user.email, sub: user._id || user.id };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user._id || user.id,
                email: user.email,
                name: user.name
            }
        };
    }

    async register(userDto: any) {
        // Hash password
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(userDto.password, salt);
        const newUser = await this.usersService.create({ ...userDto, password: hashedPassword });
        return this.login(newUser);
    }
}
