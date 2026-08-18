import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    requestOtp(telephone: string): Promise<{
        message: string;
    }>;
    promoteAdmin(email: string, key: string): Promise<any>;
    verifyOtp(telephone: string, code: string): Promise<{
        message: string;
    }>;
    refresh(user: any, refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(user: any): Promise<void>;
}
