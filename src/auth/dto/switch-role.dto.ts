import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '../../common/enums/role.enum';

export class SwitchRoleDto {
  @ApiProperty({
    description: 'Role to switch to',
    enum: RoleName,
    example: 'CREATOR',
  })
  @IsEnum(RoleName, {
    message: 'Role must be one of: CUSTOMER, CREATOR, SALON, ADMIN',
  })
  @IsNotEmpty({ message: 'Role is required' })
  role: RoleName;
}
