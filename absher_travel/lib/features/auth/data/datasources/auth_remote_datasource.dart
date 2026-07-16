import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/network/api_client.dart';
import '../models/user_model.dart';

part 'auth_remote_datasource.g.dart';

@riverpod
AuthRemoteDataSource authRemoteDataSource(Ref ref) {
  return AuthRemoteDataSourceImpl(ref.read(dioProvider));
}

abstract class AuthRemoteDataSource {
  Future<({UserModel user, String accessToken, String refreshToken})> login({
    String? email,
    String? phone,
    required String password,
  });

  Future<({UserModel user, String accessToken, String refreshToken})> register({
    String? email,
    String? phone,
    required String password,
    String? firstName,
    String? lastName,
    String? nationality,
    String? gender,
    String? dateOfBirth,
  });

  Future<void> logout({String? refreshToken});

  Future<UserModel> getCurrentUser();
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final Dio _dio;
  AuthRemoteDataSourceImpl(this._dio);

  @override
  Future<({UserModel user, String accessToken, String refreshToken})> login({
    String? email,
    String? phone,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        '/auth/login',
        data: {
          if (email != null) 'email': email,
          if (phone != null) 'phone': phone,
          'password': password,
        },
      );
      final data = response.data as Map<String, dynamic>;
      return (
        user: UserModel.fromJson(data['user'] as Map<String, dynamic>),
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
      );
    } on DioException catch (e) {
      throw mapDioExceptionToAppException(e);
    }
  }

  @override
  Future<({UserModel user, String accessToken, String refreshToken})> register({
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
      final response = await _dio.post(
        '/auth/register',
        data: {
          if (email != null) 'email': email,
          if (phone != null) 'phone': phone,
          'password': password,
          if (firstName != null) 'firstName': firstName,
          if (lastName != null) 'lastName': lastName,
          if (nationality != null) 'nationality': nationality,
          if (gender != null) 'gender': gender,
          if (dateOfBirth != null) 'dateOfBirth': dateOfBirth,
        },
      );
      final data = response.data as Map<String, dynamic>;
      return (
        user: UserModel.fromJson(data['user'] as Map<String, dynamic>),
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
      );
    } on DioException catch (e) {
      throw mapDioExceptionToAppException(e);
    }
  }

  @override
  Future<void> logout({String? refreshToken}) async {
    try {
      await _dio.post(
        '/auth/logout',
        data: {if (refreshToken != null) 'refreshToken': refreshToken},
      );
    } on DioException catch (e) {
      throw mapDioExceptionToAppException(e);
    }
  }

  @override
  Future<UserModel> getCurrentUser() async {
    try {
      final response = await _dio.get('/auth/me');
      return UserModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw mapDioExceptionToAppException(e);
    }
  }
}
