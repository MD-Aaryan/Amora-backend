import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AdminUserStatusAction {
  ACTIVATE = 'activate',
  SUSPEND = 'suspend',
  BLOCK = 'block',
  DELETE = 'delete',
}

export class UpdateUserStatusDto {
  @ApiProperty({
    description: 'Action to perform on the user',
    enum: AdminUserStatusAction,
    example: AdminUserStatusAction.SUSPEND,
  })
  @IsEnum(AdminUserStatusAction)
  action: AdminUserStatusAction;

  @ApiPropertyOptional({
    description: 'Reason for the status change',
    example: 'Violation of terms of service',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
