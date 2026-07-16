import 'package:equatable/equatable.dart';

class BookingEntity extends Equatable {
  final String id;
  final String userId;
  final String? bookingType;
  final String status;
  final double? totalAmount;
  final String? currency;
  final String? referenceNumber;
  final String? notes;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const BookingEntity({
    required this.id,
    required this.userId,
    this.bookingType,
    required this.status,
    this.totalAmount,
    this.currency,
    this.referenceNumber,
    this.notes,
    required this.createdAt,
    this.updatedAt,
  });

  String get statusAr {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'confirmed': return 'مؤكد';
      case 'cancelled': return 'ملغي';
      case 'completed': return 'مكتمل';
      default: return status;
    }
  }

  @override
  List<Object?> get props => [id, userId, status, totalAmount, referenceNumber];
}
