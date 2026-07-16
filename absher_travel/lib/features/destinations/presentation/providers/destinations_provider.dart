import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../domain/entities/destination_entity.dart';
import '../../data/repositories/destinations_repository_impl.dart';

part 'destinations_provider.g.dart';

@riverpod
Future<List<DestinationEntity>> destinationsList(Ref ref) async {
  final repo = ref.read(destinationsRepositoryProvider);
  final result = await repo.getDestinations();
  return result.fold((_) => [], (data) => data);
}

@riverpod
Future<DestinationEntity> destinationDetail(Ref ref, String id) async {
  final repo = ref.read(destinationsRepositoryProvider);
  final result = await repo.getDestinationById(id);
  return result.fold(
    (f) => throw Exception(f.message),
    (data) => data,
  );
}
