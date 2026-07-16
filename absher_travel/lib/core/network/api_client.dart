import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../constants/app_constants.dart';
import '../errors/exceptions.dart';
import 'token_interceptor.dart';

part 'api_client.g.dart';

@riverpod
Dio dio(Ref ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConstants.baseUrl,
      connectTimeout: Duration(milliseconds: AppConstants.connectTimeout),
      receiveTimeout: Duration(milliseconds: AppConstants.receiveTimeout),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  dio.interceptors.add(ref.read(tokenInterceptorProvider));
  dio.interceptors.add(LogInterceptor(
    requestBody: true,
    responseBody: true,
    error: true,
  ));

  return dio;
}

extension DioResponseHandler on Response {
  T dataAs<T>() => data as T;
}

DioException handleDioException(DioException e) {
  return e;
}

Exception mapDioExceptionToAppException(DioException e) {
  switch (e.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.receiveTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.connectionError:
      return const NetworkException();
    case DioExceptionType.badResponse:
      final statusCode = e.response?.statusCode;
      final message = _extractMessage(e.response?.data);
      if (statusCode == 401) {
        return UnauthorizedException(message: message);
      }
      if (statusCode == 404) {
        return NotFoundException(message: message);
      }
      if (statusCode == 422 || statusCode == 400) {
        return ValidationException(message: message);
      }
      return ServerException(message: message, statusCode: statusCode);
    default:
      return ServerException(message: e.message ?? 'خطأ غير معروف');
  }
}

String _extractMessage(dynamic data) {
  if (data == null) return 'حدث خطأ';
  if (data is Map) {
    return data['error']?.toString() ??
        data['message']?.toString() ??
        'حدث خطأ';
  }
  return data.toString();
}
