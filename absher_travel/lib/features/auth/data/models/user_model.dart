import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/user_entity.dart';

part 'user_model.g.dart';

@JsonSerializable()
class UserModel {
  final String id;
  final String? email;
  final String? phone;
  @JsonKey(name: 'first_name')
  final String? firstName;
  @JsonKey(name: 'last_name')
  final String? lastName;
  final String role;
  @JsonKey(name: 'is_active')
  final bool isActive;
  final String? nationality;
  final String? gender;
  @JsonKey(name: 'date_of_birth')
  final String? dateOfBirth;
  @JsonKey(name: 'last_login_at')
  final String? lastLoginAt;
  @JsonKey(name: 'created_at')
  final String createdAt;

  const UserModel({
    required this.id,
    this.email,
    this.phone,
    this.firstName,
    this.lastName,
    required this.role,
    required this.isActive,
    this.nationality,
    this.gender,
    this.dateOfBirth,
    this.lastLoginAt,
    required this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);

  Map<String, dynamic> toJson() => _$UserModelToJson(this);

  UserEntity toEntity() => UserEntity(
        id: id,
        email: email,
        phone: phone,
        firstName: firstName,
        lastName: lastName,
        role: role,
        isActive: isActive,
        nationality: nationality,
        gender: gender,
        dateOfBirth: dateOfBirth,
        lastLoginAt:
            lastLoginAt != null ? DateTime.tryParse(lastLoginAt!) : null,
        createdAt: DateTime.parse(createdAt),
      );

  factory UserModel.fromEntity(UserEntity entity) => UserModel(
        id: entity.id,
        email: entity.email,
        phone: entity.phone,
        firstName: entity.firstName,
        lastName: entity.lastName,
        role: entity.role,
        isActive: entity.isActive,
        nationality: entity.nationality,
        gender: entity.gender,
        dateOfBirth: entity.dateOfBirth,
        lastLoginAt: entity.lastLoginAt?.toIso8601String(),
        createdAt: entity.createdAt.toIso8601String(),
      );
}
