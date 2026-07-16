import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/offer_entity.dart';

abstract class OffersRepository {
  Future<Either<Failure, List<OfferEntity>>> getOffers();
  Future<Either<Failure, OfferEntity>> getOfferById(String id);
}
