import 'package:equatable/equatable.dart';

class DestinationEntity extends Equatable {
  final String id;
  final String name;
  final String? nameAr;
  final String? description;
  final String? descriptionAr;
  final String? country;
  final String? imageUrl;
  final bool isActive;
  final DateTime createdAt;

  const DestinationEntity({
    required this.id,
    required this.name,
    this.nameAr,
    this.description,
    this.descriptionAr,
    this.country,
    this.imageUrl,
    required this.isActive,
    required this.createdAt,
  });

  String get displayName => nameAr ?? name;
  String get displayDescription => descriptionAr ?? description ?? '';

  @override
  List<Object?> get props => [id, name, nameAr, country, imageUrl, isActive];
}
