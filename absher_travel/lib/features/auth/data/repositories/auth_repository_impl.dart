import 'dart:convert';
import 'package:dartz/dartz.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/utils/secure_storage.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';
import '../models/user_model.dart';

part 'auth_repository_impl.g.dart';

@riverpod
AuthRepository authRepository(Ref ref) {
  return AuthRepositoryImpl(
    remoteDataSource: ref.read(authRemoteDataSourceProvider),
    secureStorage: ref.read(secureStorageProvider),
  );
}

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final SecureStorage _secureStorage;

  AuthRepositoryImpl({
    required AuthRemoteDataSource remoteDataSource,
    required SecureStorage secureStorage,
  })  : _remoteDataSource = remoteDataSource,
        _secureStorage = secureStorage;

  @override
  Future<Either<Failure, ({UserEntity user, String accessToken, String refreshToken})>> login({
    String? email,
    String? phone,
    required String password,
  }) async {
    try {
      final result = await _remoteDataSource.login(
        email: email,
        phone: phone,
        password: password,
      );
      await saveAuthData(
        user: result.user.toEntity(),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      );
      return Right((
        user: result.user.toEntity(),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      ));
    } on UnauthorizedException catch (e) {
      return Left(UnauthorizedFailure(message: e.message));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, statusCode: e.statusCode));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, ({UserEntity user, String accessToken, String refreshToken})>> register({
    String? email,
    String? phone,
    required String password,
    String? firstName,
    String? lastName,
    String? nationality,
    String? gender,
    String? dateOfBirth,
  }) async {
    try {
      final result = await _remoteDataSource.register(
        email: email,
        phone: phone,
        password: password,
        firstName: firstName,
        lastName: lastName,
        nationality: nationality,
        gender: gender,
        dateOfBirth: dateOfBirth,
      );
      await saveAuthData(
        user: result.user.toEntity(),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      );
      return Right((
        user: result.user.toEntity(),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      ));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, statusCode: e.statusCode));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> logout({String? refreshToken}) async {
    try {
      final storedRefreshToken = await _secureStorage.getRefreshToken();
      await _remoteDataSource.logout(
        refreshToken: storedRefreshToken ?? refreshToken,
      );
      await _secureStorage.clearAll();
      return const Right(null);
    } catch (_) {
      // Always clear local data on logout, even if API fails
      await _secureStorage.clearAll();
      return const Right(null);
    }
  }

  @override
  Future<Either<Failure, UserEntity>> getCurrentUser() async {
    try {
      final userJson = await _secureStorage.getUserData();
      if (userJson != null) {
        final model = UserModel.fromJson(
          jsonDecode(userJson) as Map<String, dynamic>,
        );
        return Right(model.toEntity());
      }
      final remoteUser = await _remoteDataSource.getCurrentUser();
      await _secureStorage.saveUserData(jsonEncode(remoteUser.toJson()));
      return Right(remoteUser.toEntity());
    } on UnauthorizedException catch (e) {
      return Left(UnauthorizedFailure(message: e.message));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    } on CacheException catch (e) {
      return Left(CacheFailure(message: e.message));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<bool> isAuthenticated() async {
    return _secureStorage.hasAccessToken();
  }

  @override
  Future<void> saveAuthData({
    required UserEntity user,
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _secureStorage.saveAccessToken(accessToken),
      _secureStorage.saveRefreshToken(refreshToken),
      _secureStorage.saveUserData(
        jsonEncode(UserModel.fromEntity(user).toJson()),
      ),
    ]);
  }

  @override
  Future<void> clearAuthData() async {
    await _secureStorage.clearAll();
  }
}
