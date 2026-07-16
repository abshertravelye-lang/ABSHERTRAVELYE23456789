// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'program_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ProgramModel _$ProgramModelFromJson(Map<String, dynamic> json) => ProgramModel(
      id: json['id'] as String,
      title: json['title'] as String,
      titleAr: json['title_ar'] as String?,
      description: json['description'] as String?,
      descriptionAr: json['description_ar'] as String?,
      durationDays: (json['duration_days'] as num?)?.toInt(),
      price: (json['price'] as num?)?.toDouble(),
      imageUrl: json['image_url'] as String?,
      destination: json['destination'] as String?,
      isActive: json['is_active'] as bool,
      createdAt: json['created_at'] as String,
    );

Map<String, dynamic> _$ProgramModelToJson(ProgramModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'title_ar': instance.titleAr,
      'description': instance.description,
      'description_ar': instance.descriptionAr,
      'duration_days': instance.durationDays,
      'price': instance.price,
      'image_url': instance.imageUrl,
      'destination': instance.destination,
      'is_active': instance.isActive,
      'created_at': instance.createdAt,
    };
