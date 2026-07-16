import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class GetCurrentUserUseCase implements UseCaseNoParams<UserEntity> {
  final AuthRepository _repository;
  const GetCurrentUserUseCase(this._repository);

  @override
  Future<Either<Failure, UserEntity>> call() {
    return _repository.getCurrentUser();
  }
}
