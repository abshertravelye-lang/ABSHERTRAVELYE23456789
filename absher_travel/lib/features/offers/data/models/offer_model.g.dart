// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'offer_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

OfferModel _$OfferModelFromJson(Map<String, dynamic> json) => OfferModel(
      id: json['id'] as String,
      title: json['title'] as String,
      titleAr: json['title_ar'] as String?,
      description: json['description'] as String?,
      descriptionAr: json['description_ar'] as String?,
      discountPercent: (json['discount_percent'] as num?)?.toDouble(),
      price: (json['price'] as num?)?.toDouble(),
      imageUrl: json['image_url'] as String?,
      validUntil: json['valid_until'] as String?,
      isActive: json['is_active'] as bool,
      createdAt: json['created_at'] as String,
    );

Map<String, dynamic> _$OfferModelToJson(OfferModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'title_ar': instance.titleAr,
      'description': instance.description,
      'description_ar': instance.descriptionAr,
      'discount_percent': instance.discountPercent,
      'price': instance.price,
      'image_url': instance.imageUrl,
      'valid_until': instance.validUntil,
      'is_active': instance.isActive,
      'created_at': instance.createdAt,
    };
