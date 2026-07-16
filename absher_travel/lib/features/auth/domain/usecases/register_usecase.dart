import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class RegisterUseCase
    implements UseCase<({UserEntity user, String accessToken, String refreshToken}), RegisterParams> {
  final AuthRepository _repository;
  const RegisterUseCase(this._repository);

  @override
  Future<Either<Failure, ({UserEntity user, String accessToken, String refreshToken})>> call(
      RegisterParams params) {
    return _repository.register(
      email: params.email,
      phone: params.phone,
      password: params.password,
      firstName: params.firstName,
      lastName: params.lastName,
      nationality: params.nationality,
      gender: params.gender,
      dateOfBirth: params.dateOfBirth,
    );
  }
}

class RegisterParams extends Equatable {
  final String? email;
  final String? phone;
  final String password;
  final String? firstName;
  final String? lastName;
  final String? nationality;
  final String? gender;
  final String? dateOfBirth;

  const RegisterParams({
    this.email,
    this.phone,
    required this.password,
    this.firstName,
    this.lastName,
    this.nationality,
    this.gender,
    this.dateOfBirth,
  });

  @override
  List<Object?> get props =>
      [email, phone, password, firstName, lastName, nationality, gender, dateOfBirth];
}
