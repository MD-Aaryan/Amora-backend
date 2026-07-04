import { IsNotEmpty, IsString } from 'class-validator';

export class FirebaseLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Firebase ID token is required' })
  idToken: string;
}
