import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/offer_entity.dart';

part 'offer_model.g.dart';

@JsonSerializable()
class OfferModel {
  final String id;
  final String title;
  @JsonKey(name: 'title_ar')
  final String? titleAr;
  final String? description;
  @JsonKey(name: 'description_ar')
  final String? descriptionAr;
  @JsonKey(name: 'discount_percent')
  final double? discountPercent;
  final double? price;
  @JsonKey(name: 'image_url')
  final String? imageUrl;
  @JsonKey(name: 'valid_until')
  final String? validUntil;
  @JsonKey(name: 'is_active')
  final bool isActive;
  @JsonKey(name: 'created_at')
  final String createdAt;

  const OfferModel({
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

  factory OfferModel.fromJson(Map<String, dynamic> json) => _$OfferModelFromJson(json);
  Map<String, dynamic> toJson() => _$OfferModelToJson(this);

  OfferEntity toEntity() => OfferEntity(
        id: id,
        title: title,
        titleAr: titleAr,
        description: description,
        descriptionAr: descriptionAr,
        discountPercent: discountPercent,
        price: price,
        imageUrl: imageUrl,
        validUntil: validUntil != null ? DateTime.tryParse(validUntil!) : null,
        isActive: isActive,
        createdAt: DateTime.parse(createdAt),
      );
}
