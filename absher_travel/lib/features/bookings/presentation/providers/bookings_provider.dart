import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../domain/entities/booking_entity.dart';
import '../../data/repositories/bookings_repository_impl.dart';

part 'bookings_provider.g.dart';

@riverpod
Future<List<BookingEntity>> userBookings(Ref ref) async {
  final repo = ref.read(bookingsRepositoryProvider);
  final result = await repo.getUserBookings();
  return result.fold((_) => [], (data) => data);
}

@riverpod
Future<BookingEntity> bookingDetail(Ref ref, String id) async {
  final repo = ref.read(bookingsRepositoryProvider);
  final result = await repo.getBookingById(id);
  return result.fold((f) => throw Exception(f.message), (data) => data);
}
