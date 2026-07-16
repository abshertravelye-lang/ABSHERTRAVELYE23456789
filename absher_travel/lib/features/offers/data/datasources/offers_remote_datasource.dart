import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/network/api_client.dart';
import '../models/offer_model.dart';

part 'offers_remote_datasource.g.dart';

@riverpod
OffersRemoteDataSource offersRemoteDataSource(Ref ref) =>
    OffersRemoteDataSourceImpl(ref.read(dioProvider));

abstract class OffersRemoteDataSource {
  Future<List<OfferModel>> getOffers();
  Future<OfferModel> getOfferById(String id);
}

class OffersRemoteDataSourceImpl implements OffersRemoteDataSource {
  final Dio _dio;
  OffersRemoteDataSourceImpl(this._dio);

  @override
  Future<List<OfferModel>> getOffers() async {
    try {
      final response = await _dio.get('/offers');
      final list = response.data as List;
      return list.map((e) => OfferModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw mapDioExceptionToAppException(e);
    }
  }

  @override
  Future<OfferModel> getOfferById(String id) async {
    try {
      final response = await _dio.get('/offers/$id');
      return OfferModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw mapDioExceptionToAppException(e);
    }
  }
}
