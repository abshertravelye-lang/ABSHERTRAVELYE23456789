import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/usecases/register_usecase.dart';
import '../../domain/usecases/logout_usecase.dart';
import '../../domain/usecases/get_current_user_usecase.dart';
import '../../data/repositories/auth_repository_impl.dart';

part 'auth_provider.g.dart';

class AuthState {
  final UserEntity? user;
  final bool isLoading;
  final String? error;

  const AuthState({this.user, this.isLoading = false, this.error});

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    UserEntity? user,
    bool? isLoading,
    String? error,
    bool clearUser = false,
    bool clearError = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

@riverpod
class AuthStateNotifier extends _$AuthStateNotifier {
  @override
  FutureOr<AuthState> build() async {
    final repo = ref.read(authRepositoryProvider);
    final isAuth = await repo.isAuthenticated();
    if (!isAuth) return const AuthState();

    final result = await GetCurrentUserUseCase(repo).call();
    return result.fold(
      (_) => const AuthState(),
      (user) => AuthState(user: user),
    );
  }

  Future<String?> login({String? email, String? phone, required String password}) async {
    state = const AsyncLoading();
    final repo = ref.read(authRepositoryProvider);
    final result = await LoginUseCase(repo).call(
      LoginParams(email: email, phone: phone, password: password),
    );
    return result.fold(
      (failure) {
        state = AsyncData(AuthState(error: failure.message));
        return failure.message;
      },
      (data) {
        state = AsyncData(AuthState(user: data.user));
        return null;
      },
    );
  }

  Future<String?> register({
    String? email,
    String? phone,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    state = const AsyncLoading();
    final repo = ref.read(authRepositoryProvider);
    final result = await RegisterUseCase(repo).call(
      RegisterParams(
        email: email,
        phone: phone,
        password: password,
        firstName: firstName,
        lastName: lastName,
      ),
    );
    return result.fold(
      (failure) {
        state = AsyncData(AuthState(error: failure.message));
        return failure.message;
      },
      (data) {
        state = AsyncData(AuthState(user: data.user));
        return null;
      },
    );
  }

  Future<void> logout() async {
    final repo = ref.read(authRepositoryProvider);
    await LogoutUseCase(repo).call();
    state = const AsyncData(AuthState());
  }
}
