import 'package:equatable/equatable.dart';

class VisaEntity extends Equatable {
  final String id;
  final String name;
  final String? nameAr;
  final String? description;
  final String? descriptionAr;
  final String? country;
  final String? visaType;
  final int? processingDays;
  final double? fee;
  final bool isActive;
  final DateTime createdAt;

  const VisaEntity({
    required this.id,
    required this.name,
    this.nameAr,
    this.description,
    this.descriptionAr,
    this.country,
    this.visaType,
    this.processingDays,
    this.fee,
    required this.isActive,
    required this.createdAt,
  });

  String get displayName => nameAr ?? name;
  String get displayDescription => descriptionAr ?? description ?? '';

  @override
  List<Object?> get props => [id, name, country, visaType, isActive];
}
