import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/destination_entity.dart';

part 'destination_model.g.dart';

@JsonSerializable()
class DestinationModel {
  final String id;
  final String name;
  @JsonKey(name: 'name_ar')
  final String? nameAr;
  final String? description;
  @JsonKey(name: 'description_ar')
  final String? descriptionAr;
  final String? country;
  @JsonKey(name: 'image_url')
  final String? imageUrl;
  @JsonKey(name: 'is_active')
  final bool isActive;
  @JsonKey(name: 'created_at')
  final String createdAt;

  const DestinationModel({
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

  factory DestinationModel.fromJson(Map<String, dynamic> json) =>
      _$DestinationModelFromJson(json);
  Map<String, dynamic> toJson() => _$DestinationModelToJson(this);

  DestinationEntity toEntity() => DestinationEntity(
        id: id,
        name: name,
        nameAr: nameAr,
        description: description,
        descriptionAr: descriptionAr,
        country: country,
        imageUrl: imageUrl,
        isActive: isActive,
        createdAt: DateTime.parse(createdAt),
      );
}
