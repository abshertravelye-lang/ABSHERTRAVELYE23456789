import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/program_entity.dart';

part 'program_model.g.dart';

@JsonSerializable()
class ProgramModel {
  final String id;
  final String title;
  @JsonKey(name: 'title_ar')
  final String? titleAr;
  final String? description;
  @JsonKey(name: 'description_ar')
  final String? descriptionAr;
  @JsonKey(name: 'duration_days')
  final int? durationDays;
  final double? price;
  @JsonKey(name: 'image_url')
  final String? imageUrl;
  final String? destination;
  @JsonKey(name: 'is_active')
  final bool isActive;
  @JsonKey(name: 'created_at')
  final String createdAt;

  const ProgramModel({
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

  factory ProgramModel.fromJson(Map<String, dynamic> json) => _$ProgramModelFromJson(json);
  Map<String, dynamic> toJson() => _$ProgramModelToJson(this);

  ProgramEntity toEntity() => ProgramEntity(
        id: id,
        title: title,
        titleAr: titleAr,
        description: description,
        descriptionAr: descriptionAr,
        durationDays: durationDays,
        price: price,
        imageUrl: imageUrl,
        destination: destination,
        isActive: isActive,
        createdAt: DateTime.parse(createdAt),
      );
}
