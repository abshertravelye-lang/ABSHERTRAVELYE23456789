import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/network/api_client.dart';
import '../models/program_model.dart';

part 'programs_remote_datasource.g.dart';

@riverpod
ProgramsRemoteDataSource programsRemoteDataSource(Ref ref) =>
    ProgramsRemoteDataSourceImpl(ref.read(dioProvider));

abstract class ProgramsRemoteDataSource {
  Future<List<ProgramModel>> getPrograms();
  Future<ProgramModel> getProgramById(String id);
}

class ProgramsRemoteDataSourceImpl implements ProgramsRemoteDataSource {
  final Dio _dio;
  ProgramsRemoteDataSourceImpl(this._dio);

  @override
  Future<List<ProgramModel>> getPrograms() async {
    try {
      final response = await _dio.get('/programs');
      final list = response.data as List;
      return list.map((e) => ProgramModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw mapDioExceptionToAppException(e);
    }
  }

  @override
  Future<ProgramModel> getProgramById(String id) async {
    try {
      final response = await _dio.get('/programs/$id');
      return ProgramModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw mapDioExceptionToAppException(e);
    }
  }
}
