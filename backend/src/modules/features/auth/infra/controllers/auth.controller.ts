import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from '../../application/services/auth.service';
import { GoogleLoginReq, RefreshTokenReq } from '../../dtos/req.dto';
import { AuthRes } from '../../dtos/res.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or register with Google OAuth ID token' })
  @ApiResponse({
    status: 200,
    type: AuthRes,
    description: 'Google login successful',
  })
  @ApiResponse({ status: 401, description: 'Invalid Google token' })
  async googleLogin(@Body() req: GoogleLoginReq): Promise<AuthRes> {
    return this.authService.googleLogin(req);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    type: AuthRes,
    description: 'Token refreshed successfully',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(@Body() req: RefreshTokenReq): Promise<AuthRes> {
    return this.authService.refreshToken(req.refreshToken);
  }
}
