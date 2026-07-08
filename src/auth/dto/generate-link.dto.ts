import { IsEmail, IsNotEmpty } from 'class-validator';

export class GenerateLinkDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
