import 'package:equatable/equatable.dart';

class OfferEntity extends Equatable {
  final String id;
  final String title;
  final String? titleAr;
  final String? description;
  final String? descriptionAr;
  final double? discountPercent;
  final double? price;
  final String? imageUrl;
  final DateTime? validUntil;
  final bool isActive;
  final DateTime createdAt;

  const OfferEntity({
    required this.id,
    required this.title,
    this.titleAr,
    this.description,
    this.descriptionAr,
    this.discountPercent,
    this.price,
    this.imageUrl,
    this.validUntil,
    required this.isActive,
    required this.createdAt,
  });

  String get displayTitle => titleAr ?? title;
  String get displayDescription => descriptionAr ?? description ?? '';

  @override
  List<Object?> get props => [id, title, discountPercent, price, isActive];
}
