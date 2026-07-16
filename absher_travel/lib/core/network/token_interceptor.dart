import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../utils/secure_storage.dart';

part 'token_interceptor.g.dart';

@riverpod
TokenInterceptor tokenInterceptor(Ref ref) {
  return TokenInterceptor(ref.read(secureStorageProvider));
}

class TokenInterceptor extends Interceptor {
  final SecureStorage _secureStorage;

  TokenInterceptor(this._secureStorage);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _secureStorage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Token refresh logic can be added here if needed
    handler.next(err);
  }
}
