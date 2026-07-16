import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/destination_entity.dart';

abstract class DestinationsRepository {
  Future<Either<Failure, List<DestinationEntity>>> getDestinations();
  Future<Either<Failure, DestinationEntity>> getDestinationById(String id);
}
