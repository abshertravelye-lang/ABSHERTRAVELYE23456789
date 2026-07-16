import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/network/api_client.dart';
import '../models/visa_model.dart';

part 'visas_remote_datasource.g.dart';

@riverpod
VisasRemoteDataSource visasRemoteDataSource(Ref ref) =>
    VisasRemoteDataSourceImpl(ref.read(dioProvider));

abstract class VisasRemoteDataSource {
  Future<List<VisaModel>> getVisas();
  Future<VisaModel> getVisaById(String id);
}

class VisasRemoteDataSourceImpl implements VisasRemoteDataSource {
  final Dio _dio;
  VisasRemoteDataSourceImpl(this._dio);

  @override
  Future<List<VisaModel>> getVisas() async {
    try {
      final response = await _dio.get('/visas');
      final list = response.data as List;
      return list.map((e) => VisaModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw mapDioExceptionToAppException(e);
    }
  }

  @override
  Future<VisaModel> getVisaById(String id) async {
    try {
      final response = await _dio.get('/visas/$id');
      return VisaModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw mapDioExceptionToAppException(e);
    }
  }
}
