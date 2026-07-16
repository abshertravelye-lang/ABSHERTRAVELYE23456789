import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../offers/presentation/providers/offers_provider.dart';
import '../../../offers/presentation/widgets/offer_card.dart';

class FeaturedOffersSection extends ConsumerWidget {
  const FeaturedOffersSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offersAsync = ref.watch(offersListProvider);

    return SizedBox(
      height: 200,
      child: offersAsync.when(
        loading: () => ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: 3,
          itemBuilder: (_, __) => _shimmerCard(),
        ),
        error: (_, __) => const Center(child: Text('لا توجد عروض')),
        data: (offers) {
          if (offers.isEmpty) {
            return const Center(child: Text('لا توجد عروض متاحة'));
          }
          return ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: offers.length > 5 ? 5 : offers.length,
            itemBuilder: (context, index) =>
                OfferCard(offer: offers[index]),
          );
        },
      ),
    );
  }

  Widget _shimmerCard() {
    return Container(
      width: 200,
      margin: const EdgeInsets.only(right: 12),
      decoration: BoxDecoration(
        color: AppColors.border,
        borderRadius: BorderRadius.circular(16),
      ),
    );
  }
}
