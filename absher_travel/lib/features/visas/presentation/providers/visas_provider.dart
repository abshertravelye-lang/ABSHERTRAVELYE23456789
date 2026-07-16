import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../domain/entities/visa_entity.dart';
import '../../data/repositories/visas_repository_impl.dart';

part 'visas_provider.g.dart';

@riverpod
Future<List<VisaEntity>> visasList(Ref ref) async {
  final repo = ref.read(visasRepositoryProvider);
  final result = await repo.getVisas();
  return result.fold((_) => [], (data) => data);
}

@riverpod
Future<VisaEntity> visaDetail(Ref ref, String id) async {
  final repo = ref.read(visasRepositoryProvider);
  final result = await repo.getVisaById(id);
  return result.fold((f) => throw Exception(f.message), (data) => data);
}
