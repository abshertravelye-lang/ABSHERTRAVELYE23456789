import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/auth_repository.dart';

class LogoutUseCase implements UseCaseNoParams<void> {
  final AuthRepository _repository;
  const LogoutUseCase(this._repository);

  @override
  Future<Either<Failure, void>> call() async {
    return _repository.logout();
  }
}
