import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/program_entity.dart';

abstract class ProgramsRepository {
  Future<Either<Failure, List<ProgramEntity>>> getPrograms();
  Future<Either<Failure, ProgramEntity>> getProgramById(String id);
}
