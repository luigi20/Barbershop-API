import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  IsEnum,
  IsUUID,
  IsOptional,
  IsIn,
} from 'class-validator';
import { MemberRole, MembershipStatus } from '@modules/utils/enum';
export class EntityMembershipUpdateDTO {
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() entity_id?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  identity_id?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() profile_id?: string;
  @ApiProperty({ enum: MemberRole, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(MemberRole, { each: true })
  @IsIn(
    [MemberRole.ADMINISTRADOR, MemberRole.RECEPCIONISTA, MemberRole.BARBEIRO],
    { each: true },
  )
  roles: MemberRole[];
  @ApiProperty({ enum: MembershipStatus })
  @IsEnum(MembershipStatus)
  status: MembershipStatus;
}
