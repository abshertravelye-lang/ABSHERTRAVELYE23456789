class AppConstants {
  AppConstants._();

  // API
  static const String baseUrl = '/api';
  static const int connectTimeout = 30000;
  static const int receiveTimeout = 30000;

  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey = 'user_data';

  // Pagination
  static const int defaultPageSize = 20;

  // App Info
  static const String appName = 'أبشر أعمال';
  static const String appVersion = '1.0.0';
}
