import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/user_entity.dart';

abstract class AuthRepository {
  Future<Either<Failure, ({UserEntity user, String accessToken, String refreshToken})>> login({
    String? email,
    String? phone,
    required String password,
  });

  Future<Either<Failure, ({UserEntity user, String accessToken, String refreshToken})>> register({
    String? email,
    String? phone,
    required String password,
    String? firstName,
    String? lastName,
    String? nationality,
    String? gender,
    String? dateOfBirth,
  });

  Future<Either<Failure, void>> logout({String? refreshToken});

  Future<Either<Failure, UserEntity>> getCurrentUser();

  Future<bool> isAuthenticated();

  Future<void> saveAuthData({
    required UserEntity user,
    required String accessToken,
    required String refreshToken,
  });

  Future<void> clearAuthData();
}
