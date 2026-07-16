import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/booking_entity.dart';

part 'booking_model.g.dart';

@JsonSerializable()
class BookingModel {
  final String id;
  @JsonKey(name: 'user_id')
  final String userId;
  @JsonKey(name: 'booking_type')
  final String? bookingType;
  final String status;
  @JsonKey(name: 'total_amount')
  final double? totalAmount;
  final String? currency;
  @JsonKey(name: 'reference_number')
  final String? referenceNumber;
  final String? notes;
  @JsonKey(name: 'created_at')
  final String createdAt;
  @JsonKey(name: 'updated_at')
  final String? updatedAt;

  const BookingModel({
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

  factory BookingModel.fromJson(Map<String, dynamic> json) => _$BookingModelFromJson(json);
  Map<String, dynamic> toJson() => _$BookingModelToJson(this);

  BookingEntity toEntity() => BookingEntity(
        id: id,
        userId: userId,
        bookingType: bookingType,
        status: status,
        totalAmount: totalAmount,
        currency: currency,
        referenceNumber: referenceNumber,
        notes: notes,
        createdAt: DateTime.parse(createdAt),
        updatedAt: updatedAt != null ? DateTime.tryParse(updatedAt!) : null,
      );
}
