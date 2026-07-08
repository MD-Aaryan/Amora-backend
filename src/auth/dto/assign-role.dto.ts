import { IsIn, IsNotEmpty } from 'class-validator';

const ASSIGNABLE_ROLES = ['CREATOR', 'SALON'] as const;

export class AssignRoleDto {
  @IsIn(ASSIGNABLE_ROLES, {
    message: 'Role must be one of: CREATOR, SALON',
  })
  @IsNotEmpty({ message: 'Role is required' })
  role: string;
}
