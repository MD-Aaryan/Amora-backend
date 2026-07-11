import { IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const ASSIGNABLE_ROLES = ['CREATOR', 'SALON'] as const;

export class AssignRoleDto {
  @ApiProperty({
    description: 'Role to assign (CREATOR or SALON)',
    enum: ['CREATOR', 'SALON'],
    example: 'CREATOR',
  })
  @IsIn(ASSIGNABLE_ROLES, {
    message: 'Role must be one of: CREATOR, SALON',
  })
  @IsNotEmpty({ message: 'Role is required' })
  role: string;
}
