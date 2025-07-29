import ms from 'ms';

import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('ACCESS_JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<ms.StringValue>(
            'ACCESS_JWT_EXPIRES_IN',
            '15m',
          ),
        },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class JwtCustomModule {}
