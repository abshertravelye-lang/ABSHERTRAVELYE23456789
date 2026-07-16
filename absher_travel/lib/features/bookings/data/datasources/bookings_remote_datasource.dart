import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/network/api_client.dart';
import '../models/booking_model.dart';

part 'bookings_remote_datasource.g.dart';

@riverpod
BookingsRemoteDataSource bookingsRemoteDataSource(Ref ref) =>
    BookingsRemoteDataSourceImpl(ref.read(dioProvider));

abstract class BookingsRemoteDataSource {
  Future<List<BookingModel>> getUserBookings();
  Future<BookingModel> getBookingById(String id);
  Future<BookingModel> cancelBooking(String id);
}

class BookingsRemoteDataSourceImpl implements BookingsRemoteDataSource {
  final Dio _dio;
  BookingsRemoteDataSourceImpl(this._dio);

  @override
  Future<List<BookingModel>> getUserBookings() async {
    try {
      final response = await _dio.get('/bookings');
      final list = response.data as List;
      return list.map((e) => BookingModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw mapDioExceptionToAppException(e);
    }
  }

  @override
  Future<BookingModel> getBookingById(String id) async {
    try {
      final response = await _dio.get('/bookings/$id');
      return BookingModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw mapDioExceptionToAppException(e);
    }
  }

  @override
  Future<BookingModel> cancelBooking(String id) async {
    try {
      final response = await _dio.patch('/bookings/$id/cancel');
      return BookingModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw mapDioExceptionToAppException(e);
    }
  }
}
