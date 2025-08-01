import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, SendOtpDto, VerifyOtpDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiBearerAuth, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import {
  ResetPasswordDto,
  VerifyPasswordOtpDto,
} from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt.guard';
import { RefreshTokenGuard } from 'src/common/guard/refresh-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // @Post('forgot-password')
  // @ApiOperation({ summary: 'Request password reset' })
  // forgotPassword(@Body() dto: ForgotPasswordDto) {
  //   return this.authService.forgotPassword(dto);
  // }

  // @Post('reset-password')
  // @ApiOperation({ summary: 'Reset user password' })
  // resetPassword(@Body() dto: ResetPasswordDto) {
  //   return this.authService.resetPassword(dto);
  // }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
    // ✅ Use `sub` instead of `id`
    return this.authService.changePassword(req.user.sub, dto);
  }

  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP via email or phone' })
  sendOtp(@Body() body: SendOtpDto) {
    return this.authService.sendOtp(body.userId, body.method);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify user OTP' })
  verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyOtp(body.userId, body.otp);
  }

  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend OTP (after 60s)' })
  resendOtp(@Body() body: SendOtpDto) {
    return this.authService.resendOtp(body.userId, body.method);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify-password-otp')
  verifyPasswordOtp(@Body() dto: VerifyPasswordOtpDto) {
    return this.authService.verifyPasswordOtp(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

@Post('refresh-token-after-payment')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-refresh-token',
  description: 'Refresh token for re-authentication',
  required: true,
})
@HttpCode(HttpStatus.OK)
@UseGuards(RefreshTokenGuard)
async refreshAfterPayment(@Req() req: any) {
  console.log('🔁 Received request to refresh token after payment');
  console.log('🔐 req.user inside refreshAfterPayment:', req.user);

  return this.authService.generateAccessToken(req.user);
}

}
