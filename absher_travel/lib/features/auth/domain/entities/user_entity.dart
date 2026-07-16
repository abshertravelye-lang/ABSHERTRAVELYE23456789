import 'package:equatable/equatable.dart';

class UserEntity extends Equatable {
  final String id;
  final String? email;
  final String? phone;
  final String? firstName;
  final String? lastName;
  final String role;
  final bool isActive;
  final String? nationality;
  final String? gender;
  final String? dateOfBirth;
  final DateTime? lastLoginAt;
  final DateTime createdAt;

  const UserEntity({
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

  String get displayName {
    if (firstName != null && lastName != null) {
      return '$firstName $lastName';
    }
    return firstName ?? email ?? phone ?? 'مستخدم';
  }

  bool get isStaff =>
      role == 'agent' || role == 'admin' || role == 'super_admin';
  bool get isAdmin => role == 'admin' || role == 'super_admin';
  bool get isSuperAdmin => role == 'super_admin';

  @override
  List<Object?> get props => [
        id, email, phone, firstName, lastName, role, isActive,
        nationality, gender, dateOfBirth, lastLoginAt, createdAt,
      ];
}
