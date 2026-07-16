import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/visa_entity.dart';

part 'visa_model.g.dart';

@JsonSerializable()
class VisaModel {
  final String id;
  final String name;
  @JsonKey(name: 'name_ar')
  final String? nameAr;
  final String? description;
  @JsonKey(name: 'description_ar')
  final String? descriptionAr;
  final String? country;
  @JsonKey(name: 'visa_type')
  final String? visaType;
  @JsonKey(name: 'processing_days')
  final int? processingDays;
  final double? fee;
  @JsonKey(name: 'is_active')
  final bool isActive;
  @JsonKey(name: 'created_at')
  final String createdAt;

  const VisaModel({
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

  factory VisaModel.fromJson(Map<String, dynamic> json) => _$VisaModelFromJson(json);
  Map<String, dynamic> toJson() => _$VisaModelToJson(this);

  VisaEntity toEntity() => VisaEntity(
        id: id,
        name: name,
        nameAr: nameAr,
        description: description,
        descriptionAr: descriptionAr,
        country: country,
        visaType: visaType,
        processingDays: processingDays,
        fee: fee,
        isActive: isActive,
        createdAt: DateTime.parse(createdAt),
      );
}
