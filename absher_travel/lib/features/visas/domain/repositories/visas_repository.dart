import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/visa_entity.dart';

abstract class VisasRepository {
  Future<Either<Failure, List<VisaEntity>>> getVisas();
  Future<Either<Failure, VisaEntity>> getVisaById(String id);
}
