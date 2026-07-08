import { IsEnum, IsNotEmpty } from 'class-validator';
import { RoleName } from '../../common/enums/role.enum';

export class SwitchRoleDto {
  @IsEnum(RoleName, {
    message: 'Role must be one of: CUSTOMER, CREATOR, SALON, ADMIN',
  })
  @IsNotEmpty({ message: 'Role is required' })
  role: RoleName;
}
