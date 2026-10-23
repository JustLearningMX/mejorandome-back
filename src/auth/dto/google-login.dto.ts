import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'idToken es requerido' })
  idToken: string;
}
