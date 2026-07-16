import 'package:dartz/dartz.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/entities/offer_entity.dart';
import '../../domain/repositories/offers_repository.dart';
import '../datasources/offers_remote_datasource.dart';

part 'offers_repository_impl.g.dart';

@riverpod
OffersRepository offersRepository(Ref ref) =>
    OffersRepositoryImpl(ref.read(offersRemoteDataSourceProvider));

class OffersRepositoryImpl implements OffersRepository {
  final OffersRemoteDataSource _ds;
  OffersRepositoryImpl(this._ds);

  @override
  Future<Either<Failure, List<OfferEntity>>> getOffers() async {
    try {
      final models = await _ds.getOffers();
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
  Future<Either<Failure, OfferEntity>> getOfferById(String id) async {
    try {
      final model = await _ds.getOfferById(id);
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
