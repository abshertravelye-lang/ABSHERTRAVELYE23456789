import 'package:dartz/dartz.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/entities/destination_entity.dart';
import '../../domain/repositories/destinations_repository.dart';
import '../datasources/destinations_remote_datasource.dart';

part 'destinations_repository_impl.g.dart';

@riverpod
DestinationsRepository destinationsRepository(Ref ref) =>
    DestinationsRepositoryImpl(ref.read(destinationsRemoteDataSourceProvider));

class DestinationsRepositoryImpl implements DestinationsRepository {
  final DestinationsRemoteDataSource _ds;
  DestinationsRepositoryImpl(this._ds);

  @override
  Future<Either<Failure, List<DestinationEntity>>> getDestinations() async {
    try {
      final models = await _ds.getDestinations();
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
  Future<Either<Failure, DestinationEntity>> getDestinationById(String id) async {
    try {
      final model = await _ds.getDestinationById(id);
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
