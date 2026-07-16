import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../domain/entities/offer_entity.dart';
import '../../data/repositories/offers_repository_impl.dart';

part 'offers_provider.g.dart';

@riverpod
Future<List<OfferEntity>> offersList(Ref ref) async {
  final repo = ref.read(offersRepositoryProvider);
  final result = await repo.getOffers();
  return result.fold((_) => [], (data) => data);
}
