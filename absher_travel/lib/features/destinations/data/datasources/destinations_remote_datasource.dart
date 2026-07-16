import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/network/api_client.dart';
import '../models/destination_model.dart';

part 'destinations_remote_datasource.g.dart';

@riverpod
DestinationsRemoteDataSource destinationsRemoteDataSource(Ref ref) =>
    DestinationsRemoteDataSourceImpl(ref.read(dioProvider));

abstract class DestinationsRemoteDataSource {
  Future<List<DestinationModel>> getDestinations();
  Future<DestinationModel> getDestinationById(String id);
}

class DestinationsRemoteDataSourceImpl implements DestinationsRemoteDataSource {
  final Dio _dio;
  DestinationsRemoteDataSourceImpl(this._dio);

  @override
  Future<List<DestinationModel>> getDestinations() async {
    try {
      final response = await _dio.get('/destinations');
      final list = (response.data as List);
      return list.map((e) => DestinationModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw mapDioExceptionToAppException(e);
    }
  }

  @override
  Future<DestinationModel> getDestinationById(String id) async {
    try {
      final response = await _dio.get('/destinations/$id');
      return DestinationModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw mapDioExceptionToAppException(e);
    }
  }
}
