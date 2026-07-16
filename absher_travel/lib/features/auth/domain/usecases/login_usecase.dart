import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class LoginUseCase
    implements UseCase<({UserEntity user, String accessToken, String refreshToken}), LoginParams> {
  final AuthRepository _repository;
  const LoginUseCase(this._repository);

  @override
  Future<Either<Failure, ({UserEntity user, String accessToken, String refreshToken})>> call(
      LoginParams params) {
    return _repository.login(
      email: params.email,
      phone: params.phone,
      password: params.password,
    );
  }
}

class LoginParams extends Equatable {
  final String? email;
  final String? phone;
  final String password;

  const LoginParams({this.email, this.phone, required this.password});

  @override
  List<Object?> get props => [email, phone, password];
}
