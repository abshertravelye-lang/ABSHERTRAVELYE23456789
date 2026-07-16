import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../domain/entities/program_entity.dart';
import '../../data/repositories/programs_repository_impl.dart';

part 'programs_provider.g.dart';

@riverpod
Future<List<ProgramEntity>> programsList(Ref ref) async {
  final repo = ref.read(programsRepositoryProvider);
  final result = await repo.getPrograms();
  return result.fold((_) => [], (data) => data);
}

@riverpod
Future<ProgramEntity> programDetail(Ref ref, String id) async {
  final repo = ref.read(programsRepositoryProvider);
  final result = await repo.getProgramById(id);
  return result.fold((f) => throw Exception(f.message), (data) => data);
}
