import 'package:equatable/equatable.dart';

class ProgramEntity extends Equatable {
  final String id;
  final String title;
  final String? titleAr;
  final String? description;
  final String? descriptionAr;
  final int? durationDays;
  final double? price;
  final String? imageUrl;
  final String? destination;
  final bool isActive;
  final DateTime createdAt;

  const ProgramEntity({
    required this.id,
    required this.title,
    this.titleAr,
    this.description,
    this.descriptionAr,
    this.durationDays,
    this.price,
    this.imageUrl,
    this.destination,
    required this.isActive,
    required this.createdAt,
  });

  String get displayTitle => titleAr ?? title;
  String get displayDescription => descriptionAr ?? description ?? '';

  @override
  List<Object?> get props => [id, title, durationDays, price, isActive];
}
