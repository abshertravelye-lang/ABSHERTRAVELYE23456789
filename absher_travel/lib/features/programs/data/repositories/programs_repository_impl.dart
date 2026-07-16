import 'package:dartz/dartz.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/entities/program_entity.dart';
import '../../domain/repositories/programs_repository.dart';
import '../datasources/programs_remote_datasource.dart';

part 'programs_repository_impl.g.dart';

@riverpod
ProgramsRepository programsRepository(Ref ref) =>
    ProgramsRepositoryImpl(ref.read(programsRemoteDataSourceProvider));

class ProgramsRepositoryImpl implements ProgramsRepository {
  final ProgramsRemoteDataSource _ds;
  ProgramsRepositoryImpl(this._ds);

  @override
  Future<Either<Failure, List<ProgramEntity>>> getPrograms() async {
    try {
      final models = await _ds.getPrograms();
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
  Future<Either<Failure, ProgramEntity>> getProgramById(String id) async {
    try {
      final model = await _ds.getProgramById(id);
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
