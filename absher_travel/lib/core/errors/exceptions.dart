class ServerException implements Exception {
  final String message;
  final int? statusCode;
  const ServerException({required this.message, this.statusCode});
}

class NetworkException implements Exception {
  final String message;
  const NetworkException({this.message = 'لا يوجد اتصال بالإنترنت'});
}

class UnauthorizedException implements Exception {
  final String message;
  const UnauthorizedException({this.message = 'غير مصرح بالوصول'});
}

class NotFoundException implements Exception {
  final String message;
  const NotFoundException({this.message = 'لم يتم العثور على البيانات'});
}

class CacheException implements Exception {
  final String message;
  const CacheException({this.message = 'خطأ في التخزين المحلي'});
}

class ValidationException implements Exception {
  final String message;
  final Map<String, String>? fieldErrors;
  const ValidationException({required this.message, this.fieldErrors});
}
