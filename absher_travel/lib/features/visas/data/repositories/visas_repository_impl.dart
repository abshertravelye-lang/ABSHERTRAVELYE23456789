import 'package:dartz/dartz.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/entities/visa_entity.dart';
import '../../domain/repositories/visas_repository.dart';
import '../datasources/visas_remote_datasource.dart';

part 'visas_repository_impl.g.dart';

@riverpod
VisasRepository visasRepository(Ref ref) =>
    VisasRepositoryImpl(ref.read(visasRemoteDataSourceProvider));

class VisasRepositoryImpl implements VisasRepository {
  final VisasRemoteDataSource _ds;
  VisasRepositoryImpl(this._ds);

  @override
  Future<Either<Failure, List<VisaEntity>>> getVisas() async {
    try {
      final models = await _ds.getVisas();
      return Right(models.map((m) => m.toEntity()).toList());
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, VisaEntity>> getVisaById(String id) async {
    try {
      final model = await _ds.getVisaById(id);
      return Right(model.toEntity());
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}
