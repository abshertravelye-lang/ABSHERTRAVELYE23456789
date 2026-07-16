// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'visa_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

VisaModel _$VisaModelFromJson(Map<String, dynamic> json) => VisaModel(
      id: json['id'] as String,
      name: json['name'] as String,
      nameAr: json['name_ar'] as String?,
      description: json['description'] as String?,
      descriptionAr: json['description_ar'] as String?,
      country: json['country'] as String?,
      visaType: json['visa_type'] as String?,
      processingDays: (json['processing_days'] as num?)?.toInt(),
      fee: (json['fee'] as num?)?.toDouble(),
      isActive: json['is_active'] as bool,
      createdAt: json['created_at'] as String,
    );

Map<String, dynamic> _$VisaModelToJson(VisaModel instance) => <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'name_ar': instance.nameAr,
      'description': instance.description,
      'description_ar': instance.descriptionAr,
      'country': instance.country,
      'visa_type': instance.visaType,
      'processing_days': instance.processingDays,
      'fee': instance.fee,
      'is_active': instance.isActive,
      'created_at': instance.createdAt,
    };
